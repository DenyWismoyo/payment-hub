// File: src/lib/utils/email.ts

export interface SendEmailPayload {
  to: string;
  subject: string;
  billingNumber: string;
  clientName: string;
  accessCode: string;
  grandTotal: number;
  paymentUrl: string;
  dueDate: string;
}

export async function sendBillingEmail(payload: SendEmailPayload) {
  // In a real application, you would use Resend, SendGrid, or AWS SES here.
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ ... });

  console.log("=========================================");
  console.log(`📧 [MOCK EMAIL] MENGIRIM EMAIL KE: ${payload.to}`);
  console.log(`📌 Subjek: ${payload.subject}`);
  console.log(`Halo ${payload.clientName},`);
  console.log(`Tagihan Anda ${payload.billingNumber} sebesar Rp ${payload.grandTotal.toLocaleString('id-ID')} telah terbit.`);
  console.log(`Batas pembayaran: ${new Date(payload.dueDate).toLocaleDateString('id-ID')}`);
  console.log(`Kode Akses Anda: ${payload.accessCode}`);
  console.log(`Link Pembayaran: ${payload.paymentUrl}`);
  console.log(`Untuk melihat detail tagihan, silakan kunjungi portal kami dan masukkan kode akses di atas.`);
  console.log("=========================================");
  
  // Return success even in mock mode so the API doesn't crash
  return { success: true, message: "Email sent (mocked)" };
}
