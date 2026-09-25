"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import type { Billing } from "@/types";

export default function PaymentSuccessPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkBillingStatus() {
      try {
        // We can just call the public /api/pay/[code] endpoint which returns the billing
        // It checks by accessCode
        const res = await fetch(`/api/access-codes?code=${code}`);
        const json = await res.json();
        
        if (json.valid) {
          setBilling(json.billing);
          // If not paid yet (maybe webhook is slow), we might want to poll, 
          // but for now let's just display what we have.
        } else {
          router.push(`/pay/${code}`); // fallback
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (code) {
      checkBillingStatus();
    }
  }, [code, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center text-gray-500">Memeriksa status pembayaran...</div>
      </div>
    );
  }

  const isPaid = billing?.status === "paid";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success to-emerald-400" />
        
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isPaid ? "Pembayaran Berhasil!" : "Pembayaran Sedang Diproses"}
        </h1>
        <p className="text-gray-500 mb-8">
          {isPaid 
            ? "Terima kasih, pembayaran Anda telah kami terima dan akan segera kami proses."
            : "Terima kasih telah melakukan pembayaran. Kami sedang menunggu konfirmasi dari sistem pembayaran."}
        </p>

        {billing && (
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-8 border border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Nomor Tagihan</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{billing.billingNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Layanan</p>
              <p className="text-sm font-semibold text-gray-900">{billing.catalogItemName}</p>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Pembayaran</span>
              <span className="text-lg font-bold text-gray-900">
                Rp {billing.grandTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isPaid && (
            <Link 
              href={`/pay/${code}/receipt`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-semibold hover:-translate-y-0.5 transition-transform shadow-lg shadow-primary/30"
            >
              <FileText className="w-4 h-4" />
              Lihat Bukti Pembayaran
            </Link>
          )}
          <Link 
            href={`/pay/${code}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
          >
            Kembali ke Halaman Tagihan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
