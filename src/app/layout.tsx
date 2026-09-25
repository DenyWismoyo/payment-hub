import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SOSO Creative Hub — Payment Center",
    template: "%s | SOSO Payment",
  },
  description:
    "Sistem pembayaran terpusat untuk layanan dan aplikasi SOSO Creative Hub. Kelola tagihan, invoice, dan bukti pembayaran dalam satu platform.",
  keywords: [
    "payment",
    "invoice",
    "tagihan",
    "SOSO Creative Hub",
    "pembayaran online",
  ],
  authors: [{ name: "SOSO Creative Hub" }],
  openGraph: {
    title: "SOSO Creative Hub — Payment Center",
    description:
      "Sistem pembayaran terpusat untuk layanan dan aplikasi SOSO Creative Hub.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
