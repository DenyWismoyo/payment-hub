"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Calculator, Download, Calendar, PieChart } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

import type { TaxHistoryItem } from "@/types";

export default function TaxPage() {
  const [data, setData] = useState<{
    totalTaxCollected: number;
    breakdown: { name: string; amount: number }[];
    history: TaxHistoryItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTax() {
      try {
        const res = await fetchWithAuth("/api/tax/report");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        setData(json.data);
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)) || "Gagal memuat laporan pajak.");
      } finally {
        setLoading(false);
      }
    }
    fetchTax();
  }, []);

  const handleExport = async (type: string) => {
    try {
      const res = await fetchWithAuth(`/api/reports/export?type=${type}`);
      if (!res.ok) throw new Error("Gagal mengunduh file");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${type}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal melakukan export");
    }
  };

  if (loading) return <LoadingSkeleton type="card" count={4} />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Data tidak ditemukan</div>;

  const { totalTaxCollected, breakdown, history } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Alokasi Pajak" 
        description="Ringkasan dan laporan alokasi pajak dari transaksi (Lunas)"
        action={
          <>
            <button 
              onClick={() => handleExport('billings')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all"
            >
              <Download className="w-4 h-4" />
              Data Tagihan
            </button>
            <button 
              onClick={() => handleExport('tax')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              Laporan Pajak
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg"><PieChart className="w-6 h-6" /></div>
            <h3 className="font-medium text-white/90">Total Pajak Terkumpul</h3>
          </div>
          <p className="text-3xl font-bold font-mono mt-4">{formatRupiah(totalTaxCollected)}</p>
        </div>

        <div className="md:col-span-2 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Breakdown per Jenis Pajak</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {breakdown.map((item: { name: string; amount: number }, idx: number) => (
              <div key={idx} className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)] font-medium mb-1 uppercase tracking-wider">{item.name}</p>
                <p className="text-lg font-bold text-[var(--text-primary)] font-mono">{formatRupiah(item.amount)}</p>
              </div>
            ))}
            {breakdown.length === 0 && <p className="text-sm text-[var(--text-muted)]">Belum ada data pajak.</p>}
          </div>
        </div>
      </div>

      {/* Tax Detail Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--border)]">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-[var(--text-primary)]">Riwayat Potongan Pajak (50 Terakhir)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-6 py-3">No. Tagihan</th>
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-6 py-3">Klien</th>
                <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-6 py-3">Jenis Pajak</th>
                <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase px-6 py-3">Pajak</th>
                <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase px-6 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {history.map((tx: TaxHistoryItem, i: number) => (
                <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-6 py-3 text-sm font-mono text-primary">{tx.billingNumber}</td>
                  <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">{tx.clientName}</td>
                  <td className="px-6 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tx.taxName}</span></td>
                  <td className="px-6 py-3 text-sm text-right font-mono font-semibold text-[var(--text-primary)]">{formatRupiah(tx.amount)}</td>
                  <td className="px-6 py-3 text-sm text-right text-[var(--text-secondary)]">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">Belum ada riwayat pajak.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
