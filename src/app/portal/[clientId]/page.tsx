import { adminDb } from "@/lib/firebase/admin";
import { Billing, Client } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import { Clock, CheckCircle, FileText, ArrowRight, XCircle } from "lucide-react";

export default async function ClientPortalPage(props: { 
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { clientId } = params;
  const { token } = searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 max-w-md shadow-xl">
          <XCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-sm">Link portal tidak valid. Silakan minta admin untuk mengirimkan ulang link portal Anda.</p>
        </div>
      </div>
    );
  }

  const { verifyPortalToken } = await import('@/lib/utils/jwt');
  const payload = await verifyPortalToken(token);

  if (!payload || payload.clientId !== clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 max-w-md shadow-xl">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Link Kadaluarsa</h2>
          <p className="text-sm">Link portal Anda sudah kadaluarsa (berlaku 24 jam). Silakan minta admin untuk mengirimkan ulang.</p>
        </div>
      </div>
    );
  }

  // 1. Fetch Client
  const clientDoc = await adminDb.collection("clients").doc(clientId).get();
  if (!clientDoc.exists) {
    return notFound();
  }
  const client = clientDoc.data() as Client;

  // 2. Fetch Billings
  const snapshot = await adminDb
    .collection("billings")
    .where("clientId", "==", clientId)
    .orderBy("createdAt", "desc")
    .get();

  const billings = snapshot.docs.map((doc) => doc.data() as Billing);

  // Kalkulasi statistik
  let totalLunas = 0;
  let totalMenunggu = 0;
  let tagihanAktif = 0;

  billings.forEach(b => {
    if (b.status === "paid" || b.mayarStatus === "PAID") {
      totalLunas += b.grandTotal;
    } else if (b.status !== "cancelled") {
      totalMenunggu += b.grandTotal;
      tagihanAktif++;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-2xl p-8 sm:p-10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-xs tracking-wider uppercase mb-4">
                Portal Klien
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">{client.name}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                Kelola semua tagihan, riwayat transaksi, dan layanan Anda bersama SOSO Creative Hub dalam satu tempat.
              </p>
            </div>
            
            {/* Quick Stats right in header */}
            <div className="flex gap-4">
               <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Tagihan Aktif</p>
                 <p className="text-2xl font-bold">{tagihanAktif}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Timeline & History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                Tagihan Saya
              </h2>
            </div>

            <div className="space-y-4">
              {billings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Belum ada tagihan.</p>
                </div>
              ) : (
                billings.map((billing) => {
                  const isPaid = billing.status === 'paid' || billing.mayarStatus === 'PAID';
                  const isCancelled = billing.status === 'cancelled';

                  return (
                    <div key={billing.billingNumber} className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                              {billing.billingNumber}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                              : isCancelled ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                            }`}>
                              {isPaid ? "LUNAS" : isCancelled ? "DIBATALKAN" : "MENUNGGU"}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-1">{billing.catalogItemName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Jatuh tempo: {new Date(billing.dueDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-6">
                          <p className="text-2xl font-mono font-bold mb-4">{formatRupiah(billing.grandTotal)}</p>
                          
                          {isPaid ? (
                            <Link href={`/pay/${billing.accessCode}/receipt`} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                              Lihat Kuitansi <ArrowRight className="w-4 h-4" />
                            </Link>
                          ) : isCancelled ? (
                            <span className="text-sm text-slate-400">Dibatalkan</span>
                          ) : (
                            <Link href={`/pay/${billing.accessCode}`} className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                              Bayar Sekarang
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Analytics & Summary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Ringkasan</h2>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-blue-200 font-medium text-sm uppercase tracking-wider mb-2">Total Pembayaran Berhasil</p>
                <p className="text-4xl font-bold font-mono tracking-tight">{formatRupiah(totalLunas)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider mb-2">Menunggu Pembayaran</p>
              <p className="text-3xl font-bold text-orange-500 font-mono tracking-tight">{formatRupiah(totalMenunggu)}</p>
              {totalMenunggu > 0 && (
                <p className="text-sm mt-3 text-slate-500 dark:text-slate-400">
                  Anda memiliki {tagihanAktif} tagihan yang belum dibayar.
                </p>
              )}
            </div>

            {/* Timeline Placeholder */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold mb-6 uppercase text-xs tracking-wider text-slate-500">Aktivitas Terakhir</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {billings.slice(0, 3).map((b, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.status === 'paid' ? 'Pembayaran Berhasil' : 'Tagihan Diterbitkan'}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {b.catalogItemName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
