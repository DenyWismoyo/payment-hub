import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Billing, Client } from "@/types";

export async function GET(request: Request) {
  // Verifikasi Header Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const h3 = new Date(today);
    h3.setDate(h3.getDate() + 3);
    const h3Str = h3.toISOString().split('T')[0];

    const h1 = new Date(today);
    h1.setDate(h1.getDate() + 1);
    const h1Str = h1.toISOString().split('T')[0];

    // Find billings
    const snapshot = await adminDb.collection("billings")
      .where("status", "in", ["issued", "pending", "sent"])
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "No billings to remind" });
    }

    const { sendBillingEmail } = await import("@/lib/utils/email");
    const { sendWhatsApp } = await import("@/lib/utils/whatsapp");
    const { formatRupiah } = await import("@/lib/utils");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let count = 0;

    for (const doc of snapshot.docs) {
      const billing = doc.data() as Billing;
      const dueStr = billing.dueDate.split('T')[0];

      let isReminderDay = false;
      let daysLeft = 0;

      if (dueStr === h3Str) {
        isReminderDay = true;
        daysLeft = 3;
      } else if (dueStr === h1Str) {
        isReminderDay = true;
        daysLeft = 1;
      }

      if (isReminderDay) {
        // Send Email
        if (billing.clientEmail) {
          await sendBillingEmail({
            to: billing.clientEmail,
            subject: `Pengingat H-${daysLeft} Jatuh Tempo: ${billing.billingNumber}`,
            billingNumber: billing.billingNumber,
            clientName: billing.clientName,
            accessCode: billing.accessCode,
            grandTotal: billing.grandTotal,
            paymentUrl: billing.mayarPaymentUrl || undefined,
            dueDate: billing.dueDate,
            templateType: "reminder"
          });
        }

        // Send WA
        if (billing.clientId) {
          const clientDoc = await adminDb.collection("clients").doc(billing.clientId).get();
          if (clientDoc.exists) {
            const client = clientDoc.data() as Client;
            if (client.phone) {
              const portalPayLink = `${appUrl}/pay/${billing.accessCode}`;
              const waMessage = `Halo *${billing.clientName}*,\n\nIni adalah pengingat otomatis bahwa tagihan Anda nomor *${billing.billingNumber}* sebesar *${formatRupiah(billing.grandTotal)}* akan jatuh tempo dalam *${daysLeft} hari*.\n\nMohon siapkan pembayaran melalui tautan berikut:\n${portalPayLink}\n\nJika Anda sudah melakukan pembayaran, abaikan pesan ini.\n\nTerima kasih,\nSOSO Creative Hub`;
              
              await sendWhatsApp({
                to: client.phone,
                message: waMessage
              });
            }
          }
        }
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${count} reminders` });
  } catch (error: unknown) {
    console.error("[Cron Reminder Error]", error);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}
