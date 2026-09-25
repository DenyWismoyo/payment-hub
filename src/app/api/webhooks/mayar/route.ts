import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-mayar-signature");

    if (!signature) {
      return NextResponse.json({ message: "Missing signature" }, { status: 401 });
    }

    // Verify signature
    const secret = process.env.MAYAR_WEBHOOK_SECRET || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    // Webhook sebagai Source of Truth: payment.received
    if (event === "payment.received" || event === "transaction.paid") {
      const mayarInvoiceId = data.id; // Or data.invoiceId depending on the exact webhook payload of Mayar V2

      // Find the billing record in Firestore that matches the Mayar Invoice ID
      const billingsRef = adminDb.collection("billings");
      const snapshot = await billingsRef.where("mayarInvoiceId", "==", mayarInvoiceId).get();

      if (snapshot.empty) {
        console.warn(`[Webhook] No billing found for Mayar Invoice ID: ${mayarInvoiceId}`);
        return NextResponse.json({ success: true, message: "Ignored: No matching billing" });
      }

      const billingDoc = snapshot.docs[0];
      const billingData = billingDoc.data();

      // Update the status to 'paid'
      await billingDoc.ref.update({
        status: "paid",
        mayarStatus: "PAID",
        paidAt: data.paidAt || new Date().toISOString(),
        paymentMethod: data.paymentMethod || null,
        paymentChannel: data.paymentChannel || null,
        updatedAt: new Date().toISOString(),
      });

      // Also update the totalPaid for the client
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

      console.log(`[Webhook] Successfully updated billing ${billingDoc.id} to PAID`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
