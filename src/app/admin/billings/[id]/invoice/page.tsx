"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";
import { Printer } from "lucide-react";

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [billing, setBilling] = useState<Billing | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      const res = await fetch(`/api/billings/${id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setBilling(json.data);
      }
    }
    fetchBilling();
  }, [id]);

  if (!billing) return <div className="p-10 text-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[21cm] min-h-[29.7cm] mx-auto bg-white p-12 shadow-lg relative print:shadow-none print:bg-transparent print:p-0">
        
        {/* Floating Print Button */}
        <button 
          onClick={() => window.print()}
          className="absolute top-8 right-8 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 print:hidden"
        >
          <Printer className="w-4 h-4" /> Cetak PDF
        </button>

        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">INVOICE</h1>
            <p className="text-gray-500 mt-2 font-mono">{billing.billingNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">SOSO Creative Hub</h2>
            <p className="text-gray-500 text-sm mt-1">Jl. Contoh Alamat No. 123<br/>Surakarta, Jawa Tengah<br/>info@sosocreative.com</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Ditagihkan Kepada</h3>
            <p className="font-bold text-gray-800 text-lg">{billing.clientName}</p>
            <p className="text-gray-600">{billing.clientOrganization || "-"}</p>
            <p className="text-gray-500">{billing.clientEmail}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-gray-400 uppercase">Tanggal Terbit</p>
              <p className="font-medium text-gray-800 mt-1">{new Date(billing.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-400 uppercase">Jatuh Tempo</p>
              <p className="font-medium text-gray-800 mt-1">{new Date(billing.dueDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold text-gray-400 uppercase">Status</p>
              <p className={`font-bold mt-1 uppercase ${billing.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {billing.status === 'paid' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-12">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-3 font-semibold text-gray-800 uppercase text-sm">Deskripsi Layanan</th>
              <th className="text-right py-3 font-semibold text-gray-800 uppercase text-sm">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-5 text-gray-800 font-medium">
                {billing.catalogItemName}
                {billing.notes && <p className="text-sm text-gray-500 mt-1 font-normal">{billing.notes}</p>}
              </td>
              <td className="py-5 text-right font-mono text-gray-800 font-medium">{formatRupiah(billing.subtotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-1/2 space-y-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatRupiah(billing.subtotal)}</span>
            </div>
            {billing.taxDetails && billing.taxDetails.map((tax, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{tax.name}</span>
                <span className="font-mono">{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
              </div>
            ))}
            <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 pt-4 mt-4">
              <span>Total Tagihan</span>
              <span className="font-mono">{formatRupiah(billing.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
          <p>Terima kasih atas kepercayaan Anda.</p>
          <p className="mt-1">Pembayaran dapat dilakukan melalui tautan: <a href={billing.mayarPaymentUrl} className="text-blue-600 underline">{billing.mayarPaymentUrl}</a></p>
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
