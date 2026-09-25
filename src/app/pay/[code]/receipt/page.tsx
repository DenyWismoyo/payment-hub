"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch(`/api/access-codes?code=${code}`);
        const json = await res.json();
        
        if (json.valid && (json.billing.status === 'paid' || json.billing.mayarStatus === 'PAID')) {
          setBilling(json.billing);
        } else {
          router.push(`/pay/${code}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (code) {
      fetchBilling();
    }
  }, [code, router]);

  if (loading) return <div className="text-center p-20 text-gray-500">Memuat bukti pembayaran...</div>;
  if (!billing) return <div className="text-center p-20 text-red-500">Data pembayaran tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/pay/${code}/success`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-sm font-medium hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Cetak PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-none sm:rounded-2xl shadow-sm sm:shadow-lg overflow-hidden print:shadow-none print:m-0 print:w-full">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-8 text-center print:bg-white print:text-emerald-700 print:border-b print:border-emerald-100">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 print:bg-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-white print:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Bukti Pembayaran</h1>
          <p className="text-emerald-100 print:text-gray-500">
            Terima kasih, pembayaran Anda telah berhasil kami terima.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">No. Tagihan</p>
              <p className="font-mono font-semibold text-gray-900">{billing.billingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Tanggal Pembayaran</p>
              <p className="font-semibold text-gray-900">
                {billing.paidAt ? new Date(billing.paidAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Metode</p>
              <p className="font-semibold text-gray-900 capitalize">
                {(billing as Billing & { paymentMethod?: string; paymentChannel?: string }).paymentMethod || "-"} {(billing as Billing & { paymentMethod?: string; paymentChannel?: string }).paymentChannel ? `(${(billing as Billing & { paymentMethod?: string; paymentChannel?: string }).paymentChannel})` : ""}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Klien</h3>
            <div className="bg-gray-50 p-4 rounded-xl print:bg-transparent print:border print:border-gray-200">
              <p className="font-semibold text-gray-900">{billing.clientName}</p>
              <p className="text-gray-600 text-sm">{billing.clientEmail}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rincian Pembayaran</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{billing.catalogItemName}</span>
                <span className="font-medium text-gray-900">{formatRupiah(billing.subtotal)}</span>
              </div>
              
              {billing.taxDetails && billing.taxDetails.map((tax, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{tax.name} ({tax.percentage}%)</span>
                  <span className="text-gray-600">{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Dibayar</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">
                  {formatRupiah(billing.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500 print:mt-20">
            <p>Dokumen ini adalah bukti pembayaran yang sah.</p>
            <p>Diterbitkan secara otomatis oleh sistem SOSO Creative Hub.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
