"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, ExternalLink, ReceiptText, CheckCircle, Clock } from "lucide-react";
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  issued: { label: "Diterbitkan", bg: "bg-blue-100", text: "text-blue-600" },
  sent: { label: "Terkirim", bg: "bg-purple-100", text: "text-purple-600" },
  paid: { label: "Lunas", bg: "bg-green-100", text: "text-green-600" },
  overdue: { label: "Jatuh Tempo", bg: "bg-red-100", text: "text-red-600" },
  cancelled: { label: "Dibatalkan", bg: "bg-gray-200", text: "text-gray-500" },
};

export default function BillingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch(`/api/billings/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        setBilling(json.data);
      } catch (err: any) {
        setError(err.message || "Gagal memuat detail tagihan.");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Memuat detail tagihan...</div>;
  if (error || !billing) return <div className="text-center py-20 text-red-500">{error || "Tagihan tidak ditemukan"}</div>;

  const currentStatus = statusConfig[billing.status] || statusConfig.issued;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billings" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Tagihan</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-mono">{billing.billingNumber}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${currentStatus.bg} ${currentStatus.text}`}>
                {currentStatus.label}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/billings/${id}/invoice`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Invoice
          </Link>
          {billing.mayarPaymentUrl && (
            <a
              href={billing.mayarPaymentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Payment Link
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* INFO KLIEN & PRODUK */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blue-500" />
              Informasi Utama
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Klien</p>
                <p className="font-semibold text-gray-900">{billing.clientName}</p>
                <p className="text-gray-500 text-xs">{billing.clientEmail}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Layanan / Produk</p>
                <p className="font-semibold text-gray-900">{billing.catalogItemName}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Tanggal Terbit</p>
                <p className="font-semibold text-gray-900">{new Date(billing.issuedAt).toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Jatuh Tempo</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400" />
                  {new Date(billing.dueDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Catatan</p>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{billing.notes || "Tidak ada catatan."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY KEUANGAN */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4 opacity-90">Rincian Biaya</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Subtotal</span>
                <span className="font-medium">{formatRupiah(billing.subtotal)}</span>
              </div>

              {billing.taxDetails && billing.taxDetails.map((tax, i) => (
                <div key={i} className="flex justify-between items-center text-slate-400">
                  <span>{tax.name}</span>
                  <span>{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
                </div>
              ))}

              <hr className="border-slate-700 my-4" />

              <div className="flex justify-between items-center">
                <span className="text-slate-100 font-medium">Grand Total</span>
                <span className="text-2xl font-bold text-white font-mono">{formatRupiah(billing.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* MAYAR STATUS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Status Pembayaran</h3>
             
             <div className="flex items-center gap-3 mb-4">
               {billing.mayarStatus === "PAID" || billing.status === "paid" ? (
                 <CheckCircle className="w-8 h-8 text-green-500" />
               ) : (
                 <Clock className="w-8 h-8 text-orange-400" />
               )}
               <div>
                 <p className="text-sm font-bold text-gray-900">{billing.status === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}</p>
                 <p className="text-xs text-gray-500">via Mayar.id</p>
               </div>
             </div>

             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 font-semibold mb-1">KODE AKSES KLIEN</p>
                <code className="text-xl font-bold font-mono text-blue-900 tracking-widest">{billing.accessCode}</code>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
