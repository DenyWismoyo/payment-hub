import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

/**
 * POST /api/webhooks/mayar
 * 
 * Webhook handler untuk Mayar.id payment events.
 * Source of truth untuk konfirmasi pembayaran.
 * 
 * Flow:
 * 1. Validasi signature
 * 2. Simpan webhook log (audit trail)
 * 3. Cari billing terkait
 * 4. Update billing status → paid
 * 5. Simpan payment record terpisah
 * 6. Simpan tax_allocations
 * 7. Mark access_code as used
 * 8. Update client totalPaid
 */
export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-mayar-signature");

    // ── 1. Verify signature ──────────────────────────────────
    if (!signature) {
      await logWebhook("missing_signature", null, rawBody, "rejected", receivedAt);
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.MAYAR_WEBHOOK_SECRET || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      await logWebhook("invalid_signature", null, rawBody, "rejected", receivedAt);
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    // ── 2. Log webhook (audit trail) ─────────────────────────
    const logId = await logWebhook(event, data?.id, rawBody, "processing", receivedAt);

    // ── 3. Handle payment events ─────────────────────────────
    if (event === "payment.received" || event === "transaction.paid") {
      const mayarInvoiceId = data.id;

      // Cari billing berdasarkan Mayar Invoice ID
      const billingsRef = adminDb.collection("billings");
      const snapshot = await billingsRef.where("mayarInvoiceId", "==", mayarInvoiceId).get();

      if (snapshot.empty) {
        console.warn(`[Webhook] No billing found for Mayar Invoice ID: ${mayarInvoiceId}`);
        await updateWebhookLog(logId, "ignored", "No matching billing found");
        return NextResponse.json({ success: true, message: "Ignored: No matching billing" });
      }

      const billingDoc = snapshot.docs[0];
      const billingData = billingDoc.data();

      // Idempotency: cek apakah sudah pernah diproses
      if (billingData.status === "paid") {
        console.log(`[Webhook] Billing ${billingDoc.id} already paid, skipping duplicate`);
        await updateWebhookLog(logId, "duplicate", "Billing already paid");
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      const paidAt = data.paidAt || new Date().toISOString();
      const batch = adminDb.batch();

      // ── 4. Update billing status → paid ────────────────────
      batch.update(billingDoc.ref, {
        status: "paid",
        mayarStatus: "PAID",
        paidAt,
        paymentMethod: data.paymentMethod || null,
        paymentChannel: data.paymentChannel || null,
        updatedAt: new Date().toISOString(),
      });

      // ── 5. Create payment record ───────────────────────────
      const paymentRef = adminDb.collection("payments").doc();
      batch.set(paymentRef, {
        billingId: billingDoc.id,
        billingNumber: billingData.billingNumber,
        mayarTransactionId: mayarInvoiceId,
        status: "paid",
        amount: billingData.grandTotal || data.amount,
        paymentMethod: data.paymentMethod || "unknown",
        paymentChannel: data.paymentChannel || "unknown",
        paidAt,
        rawWebhookData: data,
        createdAt: new Date().toISOString(),
      });

      // ── 6. Create tax_allocations ──────────────────────────
      if (billingData.taxDetails && Array.isArray(billingData.taxDetails)) {
        const period = new Date(paidAt).toISOString().substring(0, 7); // "2026-09"

        for (const tax of billingData.taxDetails) {
          const taxRef = adminDb.collection("tax_allocations").doc();
          batch.set(taxRef, {
            paymentId: paymentRef.id,
            billingId: billingDoc.id,
            billingNumber: billingData.billingNumber,
            clientName: billingData.clientName,
            taxType: tax.type,
            name: tax.name,
            percentage: tax.percentage,
            amount: tax.amount,
            description: `${tax.name} dari ${billingData.billingNumber}`,
            period,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // ── 6.5 Generate invoice/receipt record ────────────────
      const receiptRef = adminDb.collection("invoices").doc();
      batch.set(receiptRef, {
        billingId: billingDoc.id,
        invoiceNumber: `RCT-${billingData.billingNumber.replace("INV-", "")}`,
        type: "receipt",
        pdfUrl: null,
        generatedAt: new Date().toISOString(),
      });

      // ── 7. Mark access_code as used ────────────────────────
      if (billingData.accessCode) {
        const codeRef = adminDb.collection("access_codes").doc(billingData.accessCode);
        batch.update(codeRef, {
          isUsed: true,
          usedAt: new Date().toISOString(),
        });
      }

      // ── 8. Update client totalPaid ─────────────────────────
      if (billingData.clientId) {
        const clientRef = adminDb.collection("clients").doc(billingData.clientId);
        // Use transaction for atomic increment (outside batch)
        // We'll do this after batch commit
      }

      await batch.commit();

      // Update client stats in separate transaction
      if (billingData.clientId) {
        const clientRef = adminDb.collection("clients").doc(billingData.clientId);
        await adminDb.runTransaction(async (transaction) => {
          const clientDoc = await transaction.get(clientRef);
          if (clientDoc.exists) {
            const clientData = clientDoc.data();
            transaction.update(clientRef, {
              totalPaid: (clientData?.totalPaid || 0) + (billingData.grandTotal || 0),
              updatedAt: new Date().toISOString(),
            });
          }
        });
      }

      await updateWebhookLog(logId, "success", `Billing ${billingDoc.id} marked as PAID`);
      console.log(`[Webhook] Successfully processed payment for billing ${billingDoc.id}`);
    } else {
      await updateWebhookLog(logId, "ignored", `Unhandled event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Webhook Error]", error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ── Helpers ────────────────────────────────────────────────────

async function logWebhook(
  event: string,
  mayarId: string | null,
  rawBody: string,
  status: string,
  receivedAt: string
): Promise<string> {
  try {
    const ref = await adminDb.collection("webhook_logs").add({
      event,
      mayarId,
      rawBody,
      status,
      receivedAt,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (err) {
    console.error("[Webhook Log] Failed to save log:", err);
    return "";
  }
}

async function updateWebhookLog(
  logId: string,
  status: string,
  detail: string
): Promise<void> {
  if (!logId) return;
  try {
    await adminDb.collection("webhook_logs").doc(logId).update({
      status,
      detail,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Webhook Log] Failed to update log:", err);
  }
}
