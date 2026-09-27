"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Printer, ArrowLeft, MessageCircle, Download } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ReceiptPDF } from "@/components/pdf/ReceiptPDF";
import { useLanguage } from "@/hooks/useLanguage";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

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

  if (loading) return <div className="min-h-screen bg-gray-100 dark:bg-slate-950 text-center p-20 text-gray-500 dark:text-slate-400">{t.loading}</div>;
  if (!billing) return <div className="min-h-screen bg-gray-100 dark:bg-slate-950 text-center p-20 text-red-500">{t.notFound}</div>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const receiptUrl = `${appUrl}/pay/${code}/receipt`;
  const waShareText = encodeURIComponent(
    lang === 'id' 
      ? `Halo, berikut adalah bukti pembayaran untuk tagihan ${billing.billingNumber} sebesar ${formatRupiah(billing.grandTotal)}.\n\nLihat rincian: ${receiptUrl}`
      : `Hello, here is the payment receipt for billing ${billing.billingNumber} amounting to ${formatRupiah(billing.grandTotal)}.\n\nView details: ${receiptUrl}`
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 p-4 sm:p-8 font-sans transition-colors">
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/pay/${code}/success`} className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        <div className="flex gap-2">
          <a 
            href={`https://wa.me/?text=${waShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t.shareWa}
          </a>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {t.print}
          </button>
          
          <PDFDownloadLink
            document={<ReceiptPDF billing={billing} />}
            fileName={`Kuitansi-${billing.billingNumber}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
          >
            {({ loading }) => (
              <>
                <Download className="w-4 h-4" />
                {loading ? t.loading : t.downloadPdf}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl shadow-sm sm:shadow-lg overflow-hidden print:shadow-none print:m-0 print:w-full print:bg-white border dark:border-slate-800 print:border-none">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-8 text-center print:bg-white print:text-emerald-700 print:border-b print:border-emerald-100">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 print:bg-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-white print:text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-1 text-white">{t.receipt}</h1>
          <p className="text-emerald-100 print:text-gray-500">
            {t.thankYou}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 text-gray-900 dark:text-slate-200 print:text-gray-900">
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 border-b border-gray-100 dark:border-slate-800 print:border-gray-100 pb-8">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 print:text-gray-500 mb-1">{t.billNumber}</p>
              <p className="font-mono font-semibold">{billing.billingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 print:text-gray-500 mb-1">{t.paymentDate}</p>
              <p className="font-semibold">
                {billing.paidAt ? new Date(billing.paidAt).toLocaleDateString(lang === 'id' ? "id-ID" : "en-US", {
                  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 print:text-gray-500 mb-1">{t.paymentMethod}</p>
              <p className="font-semibold capitalize">
                {billing.paymentMethod || "-"} {billing.paymentChannel ? `(${billing.paymentChannel})` : ""}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">{t.clientDetail}</h3>
            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-xl print:bg-transparent print:border print:border-gray-200">
              <p className="font-semibold">{billing.clientName}</p>
              <p className="text-gray-600 dark:text-slate-400 print:text-gray-600 text-sm">{billing.clientEmail}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{t.paymentDetail}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-slate-400 print:text-gray-600">{billing.catalogItemName}</span>
                <span className="font-medium">{formatRupiah(billing.subtotal)}</span>
              </div>
              
              {billing.taxDetails && billing.taxDetails.map((tax, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-slate-400 print:text-gray-500">{tax.name} ({tax.percentage}%)</span>
                  <span className="text-gray-600 dark:text-slate-300 print:text-gray-600">{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 print:border-gray-200 flex justify-between items-center">
                <span className="font-bold">{t.totalPaid}</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-600 font-mono">
                  {formatRupiah(billing.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500 dark:text-slate-400 print:text-gray-500 print:mt-20">
            <p>{t.receiptFooter1}</p>
            <p>{t.receiptFooter2}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
