import { adminDb } from "@/lib/firebase/admin";
import { Billing, Client } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

export default async function ClientPortalPage(props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const { clientId } = params;

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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
              Portal Pembayaran
            </h1>
            <p className="mt-2 text-gray-500 dark:text-zinc-400">
              Selamat datang, <span className="font-semibold text-gray-900 dark:text-zinc-300">{client.name}</span>. Kelola tagihan dan riwayat transaksi Anda di sini.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-sm">
              SOSO Creative Hub
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Total Pembayaran Berhasil</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(totalLunas)}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Menunggu Pembayaran</p>
            <p className="mt-2 text-3xl font-bold text-amber-500">
              {formatRupiah(totalMenunggu)}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Tagihan Aktif</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-zinc-50">
              {tagihanAktif} <span className="text-lg font-normal text-gray-500 dark:text-zinc-400">tagihan</span>
            </p>
          </div>
        </div>

        {/* Billings Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">Riwayat Tagihan</h3>
          </div>
          
          {billings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-zinc-400">Belum ada tagihan yang diterbitkan untuk Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-900/80">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Info Tagihan</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Jatuh Tempo</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {billings.map((billing) => {
                    const isPaid = billing.status === 'paid' || billing.mayarStatus === 'PAID';
                    const isCancelled = billing.status === 'cancelled';
                    
                    return (
                      <tr key={billing.billingNumber} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{billing.catalogItemName}</span>
                            <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono mt-1">{billing.billingNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">
                          {new Date(billing.dueDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-zinc-100">
                          {formatRupiah(billing.grandTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : isCancelled
                              ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          }`}>
                            {isPaid ? "LUNAS" : isCancelled ? "DIBATALKAN" : "MENUNGGU"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isPaid ? (
                            <Link 
                              href={`/pay/${billing.accessCode}/receipt`}
                              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                              Lihat Bukti
                            </Link>
                          ) : isCancelled ? (
                            <span className="text-gray-400 dark:text-zinc-500 text-sm">-</span>
                          ) : (
                            <Link 
                              href={`/pay/${billing.accessCode}`}
                              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition-colors"
                            >
                              Bayar Sekarang
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
