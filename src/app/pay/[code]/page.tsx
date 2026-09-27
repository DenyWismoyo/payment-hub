"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Receipt, Clock, CheckCircle, Globe } from "lucide-react";
import type { Billing } from "@/types";
import { formatRupiah } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { QRCodeSVG } from "qrcode.react";

export default function PayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { lang, changeLanguage, t } = useLanguage();

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
          <p className="text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.notFound}</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{error || t.invalidCode}</p>
          <Link href="/pay" className="inline-block bg-primary hover:bg-blue-700 transition-colors text-white px-6 py-3 rounded-xl font-medium">
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = billing.status === 'paid' || billing.mayarStatus === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pay" className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.paymentDetail}</h1>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => changeLanguage('id')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${lang === 'id' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              ID
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${lang === 'en' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Status Card */}
        {isPaid ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-6 flex items-start gap-4 animate-scale-in">
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-green-900 dark:text-green-400">{t.statusPaid}</h3>
              <p className="text-green-700 dark:text-green-500 mt-1">{t.thankYou}</p>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 flex items-start gap-4">
            <Clock className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-400">{t.statusWaiting}</h3>
              <p className="text-orange-700 dark:text-orange-500 mt-1">
                {lang === 'id' ? 'Mohon segera lakukan pembayaran sebelum tanggal' : 'Please complete your payment before'}{" "}
                {new Date(billing.dueDate).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <p className="text-slate-400 font-medium mb-1">{isPaid ? t.totalPaid : "Total"}</p>
                <p className="text-4xl font-mono font-bold text-white dark:text-blue-400">{formatRupiah(billing.grandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium mb-1">{t.billNumber}</p>
                <p className="font-mono text-lg">{billing.billingNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">{t.clientDetail}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{billing.clientName}</p>
                <p className="text-gray-600 dark:text-slate-300 text-sm">{billing.clientOrganization || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Layanan / Produk</p>
                <p className="font-semibold text-gray-900 dark:text-white">{billing.catalogItemName}</p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-slate-800" />

            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">Rincian Biaya</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
                  <span>{t.subtotal}</span>
                  <span className="font-medium font-mono text-gray-900 dark:text-white">{formatRupiah(billing.subtotal)}</span>
                </div>
                {billing.taxDetails?.map((tax, i) => (
                  <div key={i} className="flex justify-between items-center text-gray-600 dark:text-slate-300">
                    <span>{tax.name}</span>
                    <span className="font-medium font-mono text-gray-900 dark:text-white">{tax.amount < 0 ? "-" : "+"}{formatRupiah(Math.abs(tax.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Payment Method Preview */}
        {!isPaid && billing.mayarPaymentUrl && (
          <div className="text-center pb-8 animate-slide-up space-y-6 mt-8">
            {/* Payment Methods Preview */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                {lang === 'id' ? 'Metode Pembayaran Tersedia' : 'Available Payment Methods'}
              </h4>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-slate-400">Virtual Account</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2">
                    <span className="font-bold text-orange-600 dark:text-orange-400">QRIS</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-slate-400">QR Code</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2">
                    <span className="font-bold text-green-600 dark:text-green-400 text-xs">e-Wallet</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-slate-400">GoPay / OVO</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-2">
                    <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-slate-400">Kartu Kredit</span>
                </div>
              </div>
            </div>

            <div>
              <a 
                href={billing.mayarPaymentUrl}
                className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                {t.payNow}
                <ExternalLink className="w-5 h-5" />
              </a>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                {lang === 'id' ? 'Pembayaran aman diproses oleh Mayar.id' : 'Secure payment processed by Mayar.id'}
              </p>
            </div>
            
            <div className="pt-8 border-t border-gray-200 dark:border-slate-800">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t.scanQr}</p>
              <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QRCodeSVG value={billing.mayarPaymentUrl} size={160} level="H" includeMargin={false} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
