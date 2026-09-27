// File: src/lib/utils/whatsapp.ts

export interface SendWhatsAppPayload {
  to: string;
  message: string;
}

export async function sendWhatsApp(payload: SendWhatsAppPayload) {
  const { to, message } = payload;
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.warn("[WhatsApp] FONNTE_TOKEN is not configured. Skipping WA notification.");
    return { success: false, message: "FONNTE_TOKEN missing" };
  }

  // Format number: remove leading 0 and replace with 62 (if Indonesian number)
  let formattedNumber = to.trim();
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.substring(1);
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: formattedNumber,
        message: message,
        countryCode: "62"
      })
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("[WhatsApp Error]", data);
      return { success: false, message: data.reason || "Gagal mengirim pesan WA" };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("[WhatsApp Exception]", error);
    return { success: false, message: (error instanceof Error ? error.message : String(error)) };
  }
}
