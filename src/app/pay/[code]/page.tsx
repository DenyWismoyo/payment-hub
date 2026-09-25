"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Receipt, Clock, CheckCircle } from "lucide-react";
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

export default function PayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch(`/api/access-codes?code=${code}`);
        const json = await res.json();
        if (!res.ok || !json.valid) {
          throw new Error(json.message || "Kode akses tidak valid");
        }
        setBilling(json.billing);
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Memuat tagihan...</p>
        </div>
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/pay" className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = billing.status === 'paid' || billing.mayarStatus === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/pay" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rincian Pembayaran</h1>
        </div>

        {/* Status Card */}
        {isPaid ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4 animate-scale-in">
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-green-900">Tagihan Sudah Lunas</h3>
              <p className="text-green-700 mt-1">Terima kasih, pembayaran Anda untuk tagihan {billing.billingNumber} telah berhasil kami terima.</p>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex items-start gap-4">
            <Clock className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-orange-900">Menunggu Pembayaran</h3>
              <p className="text-orange-700 mt-1">Mohon segera lakukan pembayaran sebelum tanggal {new Date(billing.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 bg-slate-900 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <p className="text-slate-400 font-medium mb-1">Total Tagihan</p>
                <p className="text-4xl font-mono font-bold">{formatRupiah(billing.grandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium mb-1">Nomor Tagihan</p>
                <p className="font-mono text-lg">{billing.billingNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">Ditagihkan Kepada</p>
                <p className="font-semibold text-gray-900">{billing.clientName}</p>
                <p className="text-gray-600 text-sm">{billing.clientOrganization || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Layanan / Produk</p>
                <p className="font-semibold text-gray-900">{billing.catalogItemName}</p>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <p className="text-gray-500 text-sm mb-3">Rincian Biaya</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium font-mono">{formatRupiah(billing.subtotal)}</span>
                </div>
                {billing.taxDetails?.map((tax, i) => (
                  <div key={i} className="flex justify-between items-center text-gray-600">
                    <span>{tax.name}</span>
                    <span className="font-medium font-mono">{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isPaid && billing.mayarPaymentUrl && (
          <div className="text-center pb-8 animate-slide-up">
            <a 
              href={billing.mayarPaymentUrl}
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              Bayar Sekarang
              <ExternalLink className="w-5 h-5" />
            </a>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Pembayaran aman diproses oleh Mayar.id
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
