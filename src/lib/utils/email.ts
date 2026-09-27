// File: src/lib/utils/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.NEXT_PUBLIC_SENDER_EMAIL || "billing@sosocreativehub.com";

export interface SendEmailPayload {
  to: string;
  subject: string;
  billingNumber: string;
  clientName: string;
  accessCode?: string;
  grandTotal: number;
  paymentUrl?: string;
  dueDate?: string;
  templateType?: "issued" | "paid" | "reminder";
}

export async function sendBillingEmail(payload: SendEmailPayload) {
  const {
    to,
    subject,
    billingNumber,
    clientName,
    accessCode,
    grandTotal,
    paymentUrl,
    dueDate,
    templateType = "issued"
  } = payload;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://payment.sosocreativehub.com";
  const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal);
  let html = "";

  if (templateType === "issued") {
    const portalPayLink = `${appUrl}/pay/${accessCode}`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0951EF;">Tagihan Baru: ${billingNumber}</h2>
        <p>Halo <strong>${clientName}</strong>,</p>
        <p>Tagihan baru telah diterbitkan untuk Anda sebesar <strong>${formattedTotal}</strong>.</p>
        <p>Batas waktu pembayaran: <strong>${dueDate ? new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">Kode Akses Anda:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${accessCode}</p>
        </div>

        <div style="margin: 24px 0;">
          <a href="${portalPayLink}" style="display: inline-block; background-color: #0951EF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Lihat & Bayar Tagihan →
          </a>
        </div>

        ${paymentUrl ? `
        <p style="font-size: 14px; color: #6b7280;">Atau bayar langsung via link ini:</p>
        <a href="${paymentUrl}" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 20px;">
          Bayar Langsung di Mayar.id
        </a>
        ` : ''}

        <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Anda juga dapat mengakses portal pembayaran kami di <a href="${appUrl}/pay">${appUrl}/pay</a> dan memasukkan kode akses di atas.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280;">SOSO Creative Hub Payment Center</p>
      </div>
    `;
  } else if (templateType === "paid") {
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #10B981;">Pembayaran Berhasil!</h2>
        </div>
        <p>Halo <strong>${clientName}</strong>,</p>
        <p>Terima kasih, pembayaran untuk tagihan <strong>${billingNumber}</strong> sebesar <strong>${formattedTotal}</strong> telah kami terima.</p>
        
        <a href="${appUrl}/pay/${accessCode}/receipt" style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
          Lihat & Unduh Bukti Pembayaran
        </a>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280;">SOSO Creative Hub Payment Center</p>
      </div>
    `;
  } else if (templateType === "reminder") {
    const portalPayLink = `${appUrl}/pay/${accessCode}`;
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #F59E0B;">⏰ Pengingat Tagihan: ${billingNumber}</h2>
        <p>Halo <strong>${clientName}</strong>,</p>
        <p>Ini adalah pengingat bahwa tagihan Anda sebesar <strong>${formattedTotal}</strong> akan atau telah jatuh tempo pada <strong>${dueDate ? new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong>.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">⚠️ Segera lakukan pembayaran untuk menghindari keterlambatan.</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">Kode Akses Anda:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${accessCode}</p>
        </div>

        <div style="margin: 24px 0;">
          <a href="${portalPayLink}" style="display: inline-block; background-color: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Lihat & Bayar Tagihan →
          </a>
        </div>

        ${paymentUrl ? `
        <p style="font-size: 14px; color: #6b7280;">Atau bayar langsung:</p>
        <a href="${paymentUrl}" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 20px;">
          Bayar Langsung di Mayar.id
        </a>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280;">SOSO Creative Hub Payment Center</p>
      </div>
    `;
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Email] RESEND_API_KEY is not set. Mocking email send:");
      console.log(`To: ${to} | Subject: ${subject}`);
      return { success: true, message: "Email mocked (no API key)" };
    }

    const { data, error } = await resend.emails.send({
      from: `SOSO Payment <${SENDER_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("[Email Error]", error);
      return { success: false, message: error.message };
    }

    return { success: true, message: "Email sent", id: data?.id };
  } catch (error: unknown) {
    console.error("[Email Exception]", error);
    return { success: false, message: (error instanceof Error ? error.message : String(error)) };
  }
}

export interface SendPortalEmailPayload {
  to: string;
  clientName: string;
  portalUrl: string;
}

export async function sendPortalEmail(payload: SendPortalEmailPayload) {
  const { to, clientName, portalUrl } = payload;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #0951EF;">Akses Portal Klien Anda</h2>
      <p>Halo <strong>${clientName}</strong>,</p>
      <p>Anda dapat mengakses portal pembayaran SOSO Creative Hub khusus untuk Anda melalui tautan di bawah ini. Dari portal ini, Anda dapat melihat seluruh riwayat tagihan, status pembayaran, dan mengunduh bukti pembayaran (invoice & receipt).</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0951EF;">
        <p style="margin: 0; color: #4b5563; font-size: 14px;">Tautan ini bersifat pribadi (magic link), mohon tidak membagikannya kepada pihak yang tidak berkepentingan.</p>
      </div>

      <div style="margin: 30px 0; text-align: center;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #0951EF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Buka Portal Klien →
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Atau copy-paste tautan berikut ke browser Anda: <br/><a href="${portalUrl}">${portalUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 12px; color: #6b7280;">SOSO Creative Hub Payment Center</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `SOSO Payment <${SENDER_EMAIL}>`,
      to: [to],
      subject: `Akses Portal Pembayaran SOSO - ${clientName}`,
      html,
    });

    if (error) {
      console.error("[Email Portal Error]", error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Email Portal Exception]", error);
    return { success: false, message: (error instanceof Error ? error.message : String(error)) };
  }
}

