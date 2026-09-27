import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Billing } from "@/types";

// This route should be triggered by Google Cloud Scheduler or similar cron service
export async function GET(request: NextRequest) {
  // Verifikasi token sederhana untuk keamanan (opsional, bisa pakai header khusus)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Cari semua billing yang statusnya "issued" (belum dibayar/pending) dan sudah lewat tanggal jatuh tempo
    const snapshot = await adminDb.collection("billings")
      .where("status", "in", ["issued", "pending"])
      .where("dueDate", "<", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "Tidak ada tagihan jatuh tempo", count: 0 });
    }

    const batch = adminDb.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      const billingData = doc.data() as Billing;
      
      batch.update(doc.ref, { 
        status: "overdue",
        updatedAt: now 
      });
      
      // We process email and WA after batch commit to avoid delaying the transaction
      count++;
    });

    await batch.commit();

    // Send notifications
    const { sendBillingEmail } = await import("@/lib/utils/email");
    const { sendWhatsApp } = await import("@/lib/utils/whatsapp");
    const { formatRupiah } = await import("@/lib/utils");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const doc of snapshot.docs) {
      const billing = doc.data() as Billing;
      
      if (billing.clientEmail) {
        await sendBillingEmail({
          to: billing.clientEmail,
          subject: `Peringatan Jatuh Tempo: ${billing.billingNumber}`,
          billingNumber: billing.billingNumber,
          clientName: billing.clientName,
          accessCode: billing.accessCode,
          grandTotal: billing.grandTotal,
          paymentUrl: billing.mayarPaymentUrl || undefined,
          dueDate: billing.dueDate,
          templateType: "reminder",
        });
      }

      // We need to fetch client to get phone number
      if (billing.clientId) {
        const clientDoc = await adminDb.collection("clients").doc(billing.clientId).get();
        if (clientDoc.exists) {
          const clientData = clientDoc.data();
          if (clientData?.phone) {
            const portalPayLink = `${appUrl}/pay/${billing.accessCode}`;
            const dueDateStr = new Date(billing.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const waMessage = `⚠️ *PERINGATAN JATUH TEMPO*\n\nHalo *${billing.clientName}*,\n\nTagihan Anda nomor *${billing.billingNumber}* sebesar *${formatRupiah(billing.grandTotal)}* telah melewati batas waktu pembayaran (${dueDateStr}).\n\nMohon segera lakukan pembayaran melalui tautan berikut:\n${portalPayLink}\n\nJika Anda sudah melakukan pembayaran, mohon abaikan pesan ini.\n\nTerima kasih,\nSOSO Creative Hub`;
            
            await sendWhatsApp({
              to: clientData.phone,
              message: waMessage
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil update ${count} tagihan menjadi overdue dan mengirim notifikasi`,
      count 
    });
  } catch (error: unknown) {
    console.error("[CRON /api/cron/overdue]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
