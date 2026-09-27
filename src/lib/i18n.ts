export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Shared
    loading: "Memuat tagihan...",
    notFound: "Tagihan Tidak Ditemukan",
    invalidCode: "Kode akses tidak valid atau sudah kadaluarsa.",
    backToHome: "Kembali ke Beranda",
    back: "Kembali",
    
    // Pay Page
    billDetail: "Detail Tagihan",
    billNumber: "No. Tagihan",
    status: "Status",
    statusWaiting: "Menunggu Pembayaran",
    statusPaid: "Lunas",
    clientDetail: "Detail Klien",
    paymentDetail: "Rincian Pembayaran",
    payNow: "Bayar Sekarang",
    totalPaid: "Total Dibayar",
    subtotal: "Subtotal",
    tax: "Pajak",
    dueDate: "Jatuh Tempo",
    scanQr: "Atau scan kode ini untuk membayar di perangkat lain",
    scanQrLabel: "Scan QR",
    
    // Success Page
    paymentSuccess: "Pembayaran Berhasil!",
    thankYou: "Terima kasih, pembayaran Anda telah berhasil kami terima.",
    paymentDate: "Tanggal Pembayaran",
    viewReceipt: "Lihat Bukti Pembayaran",
    
    // Receipt Page
    receipt: "Bukti Pembayaran",
    paymentMethod: "Metode",
    print: "Cetak (Print)",
    downloadPdf: "Unduh PDF",
    shareWa: "Share WA",
    receiptFooter1: "Dokumen ini adalah bukti pembayaran yang sah.",
    receiptFooter2: "Diterbitkan secara otomatis oleh sistem SOSO Creative Hub.",
  },
  en: {
    // Shared
    loading: "Loading billing...",
    notFound: "Billing Not Found",
    invalidCode: "Invalid or expired access code.",
    backToHome: "Back to Home",
    back: "Back",
    
    // Pay Page
    billDetail: "Billing Details",
    billNumber: "Billing No.",
    status: "Status",
    statusWaiting: "Waiting for Payment",
    statusPaid: "Paid",
    clientDetail: "Client Details",
    paymentDetail: "Payment Details",
    payNow: "Pay Now",
    totalPaid: "Total Paid",
    subtotal: "Subtotal",
    tax: "Tax",
    dueDate: "Due Date",
    scanQr: "Or scan this code to pay on another device",
    scanQrLabel: "Scan QR",
    
    // Success Page
    paymentSuccess: "Payment Successful!",
    thankYou: "Thank you, your payment has been successfully received.",
    paymentDate: "Payment Date",
    viewReceipt: "View Payment Receipt",
    
    // Receipt Page
    receipt: "Payment Receipt",
    paymentMethod: "Method",
    print: "Print",
    downloadPdf: "Download PDF",
    shareWa: "Share WA",
    receiptFooter1: "This document is a valid proof of payment.",
    receiptFooter2: "Generated automatically by SOSO Creative Hub system.",
  }
};
