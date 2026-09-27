import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Subscription, Billing, Client } from "@/types";
import { generateAccessCode } from "@/lib/utils/access-code";

// Initialize Mayar config
const MAYAR_API_KEY = process.env.MAYAR_API_KEY;
const MAYAR_BASE_URL = "https://api.mayar.id";

export async function GET(request: Request) {
  // Verifikasi Header Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const snapshot = await adminDb.collection("subscriptions")
      .where("status", "==", "active")
      .where("nextBillingDate", "<=", todayIso)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No recurring billings due today",
        generatedBillings: 0
      });
    }

    console.log(`[Cron] Found ${snapshot.size} recurring billings to process...`);
    const batch = adminDb.batch();
    let generatedCount = 0;

    // We can't use dynamic imports sequentially in a loop efficiently, so import tools first
    const { sendBillingEmail } = await import("@/lib/utils/email");
    const { sendWhatsApp } = await import("@/lib/utils/whatsapp");
    const { formatRupiah } = await import("@/lib/utils");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const notifications: { toEmail?: string, toPhone?: string, payload: any }[] = [];

    for (const doc of snapshot.docs) {
      const sub = doc.data() as Subscription;
      
      // Get client to ensure info is up-to-date
      const clientDoc = await adminDb.collection("clients").doc(sub.clientId).get();
      if (!clientDoc.exists) continue;
      const clientData = clientDoc.data() as Client;

      // 1. Create Mayar Invoice
      const billingNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      let mayarData = null;
      if (MAYAR_API_KEY) {
        try {
          const mayarRes = await fetch(`${MAYAR_BASE_URL}/hl/v2/invoice`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MAYAR_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: `Tagihan Langganan: ${sub.catalogItemName} - ${clientData.name}`,
              amount: sub.amount,
              customer_name: clientData.name,
              customer_email: clientData.email,
              customer_phone: clientData.phone || "",
              description: `Recurring billing untuk ${sub.catalogItemName}`
            })
          });

          if (mayarRes.ok) {
            const mayarJson = await mayarRes.json();
            mayarData = mayarJson.data;
          } else {
            console.error(`[Cron] Mayar API Error for sub ${sub.id}:`, await mayarRes.text());
          }
        } catch (e) {
          console.error(`[Cron] Mayar fetch failed for sub ${sub.id}:`, e);
        }
      }

      if (!mayarData) continue; // Skip if Mayar fails

      // 2. Create Billing
      const accessCode = generateAccessCode();
      const billingRef = adminDb.collection("billings").doc();
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newBilling: Billing = {
        id: billingRef.id,
        billingNumber,
        clientId: clientData.id,
        catalogItemId: sub.catalogItemId,
        catalogItemName: sub.catalogItemName,
        accessCode,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientType: clientData.type,
        clientOrganization: clientData.organization || "",
        subtotal: sub.amount,
        taxDetails: [],
        taxTotal: 0,
        grandTotal: sub.amount,
        currency: sub.currency,
        mayarInvoiceId: mayarData.id,
        mayarPaymentUrl: mayarData.link,
        mayarStatus: "PENDING",
        paymentMethod: null,
        paymentChannel: null,
        status: "issued",
        issuedAt: new Date().toISOString(),
        dueDate,
        paidAt: null,
        notes: "Tagihan otomatis (Recurring)",
        createdBy: "SYSTEM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(billingRef, newBilling);

      // 3. Create Access Code
      const codeRef = adminDb.collection("access_codes").doc(accessCode);
      batch.set(codeRef, {
        code: accessCode,
        billingId: billingRef.id,
        isUsed: false,
        expiresAt: dueDate,
        createdAt: new Date().toISOString()
      });

      // 4. Update Subscription nextBillingDate
      const subRef = adminDb.collection("subscriptions").doc(sub.id);
      const nextDate = new Date(sub.nextBillingDate);
      if (sub.cycle === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (sub.cycle === "quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
      else if (sub.cycle === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      batch.update(subRef, {
        nextBillingDate: nextDate.toISOString(),
        updatedAt: new Date().toISOString()
      });

      notifications.push({
        toEmail: clientData.email,
        toPhone: clientData.phone,
        payload: {
          billingNumber,
          clientName: clientData.name,
          accessCode,
          grandTotal: sub.amount,
          paymentUrl: mayarData.link,
          dueDate
        }
      });

      generatedCount++;
    }

    if (generatedCount > 0) {
      await batch.commit();

      // Send notifications
      for (const notif of notifications) {
        if (notif.toEmail) {
          await sendBillingEmail({
            to: notif.toEmail,
            subject: `Tagihan Pembayaran - ${notif.payload.billingNumber}`,
            billingNumber: notif.payload.billingNumber,
            clientName: notif.payload.clientName,
            accessCode: notif.payload.accessCode,
            grandTotal: notif.payload.grandTotal,
            paymentUrl: notif.payload.paymentUrl,
            dueDate: notif.payload.dueDate
          });
        }

        if (notif.toPhone) {
          const portalPayLink = `${appUrl}/pay/${notif.payload.accessCode}`;
          const dueStr = new Date(notif.payload.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          const waMessage = `Halo *${notif.payload.clientName}*,\n\nTagihan otomatis langganan Anda telah diterbitkan sebesar *${formatRupiah(notif.payload.grandTotal)}*.\n\nNomor Tagihan: ${notif.payload.billingNumber}\nBatas Pembayaran: ${dueStr}\n\nSilakan klik tautan di bawah ini untuk melihat detail dan melakukan pembayaran:\n${portalPayLink}\n\nTerima kasih,\nSOSO Creative Hub`;
          
          await sendWhatsApp({
            to: notif.toPhone,
            message: waMessage
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Recurring billing cron executed",
      generatedBillings: generatedCount
    });
  } catch (error: unknown) {
    console.error("[Cron Error]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
