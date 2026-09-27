"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import type { Billing } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import { formatRupiah } from "@/lib/utils";

export default function PaymentSuccessPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let pollTimeout: NodeJS.Timeout | null = null;

    async function checkBillingStatus() {
      try {
        const res = await fetch(`/api/access-codes?code=${code}`);
        const json = await res.json();
        
        if (json.valid) {
          setBilling(json.billing);

          // If already paid, stop polling
          if (json.billing.status === "paid") {
            if (pollInterval) clearInterval(pollInterval);
            if (pollTimeout) clearTimeout(pollTimeout);
            return;
          }

          // Start polling if not yet paid (webhook mungkin belum diproses)
          if (!pollInterval) {
            pollInterval = setInterval(async () => {
              try {
                const pollRes = await fetch(`/api/access-codes?code=${code}`);
                const pollJson = await pollRes.json();
                if (pollJson.valid) {
                  setBilling(pollJson.billing);
                  if (pollJson.billing.status === "paid") {
                    if (pollInterval) clearInterval(pollInterval);
                    if (pollTimeout) clearTimeout(pollTimeout);
                  }
                }
              } catch {
                // Ignore poll errors
              }
            }, 5000); // Poll every 5 seconds

            // Stop polling after 60 seconds max
            pollTimeout = setTimeout(() => {
              if (pollInterval) clearInterval(pollInterval);
            }, 60_000);
          }
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

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [code, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-slate-400">{t.loading}</div>
      </div>
    );
  }

  const isPaid = billing?.status === "paid";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success to-emerald-400" />
        
        <div className="w-20 h-20 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isPaid ? t.paymentSuccess : (lang === 'id' ? "Pembayaran Sedang Diproses" : "Payment is being processed")}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          {isPaid 
            ? t.thankYou
            : (lang === 'id' ? "Terima kasih telah melakukan pembayaran. Kami sedang menunggu konfirmasi dari sistem pembayaran." : "Thank you for your payment. We are waiting for confirmation from the payment system.")}
        </p>

        {billing && (
          <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-4 text-left space-y-3 mb-8 border border-gray-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t.billNumber}</p>
              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{billing.billingNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Layanan / Service</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{billing.catalogItemName}</p>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{lang === 'id' ? 'Total Pembayaran' : 'Total Payment'}</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatRupiah(billing.grandTotal)}
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
              {t.viewReceipt}
            </Link>
          )}
          <Link 
            href={`/pay/${code}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            {t.back}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
