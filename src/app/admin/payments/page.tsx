"use client";

import { CreditCard, Search, Download, Clock } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Payment } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetchWithAuth("/api/payments");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        setPayments(json.data);
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)) || "Gagal memuat data pembayaran.");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const handleExport = async () => {
    try {
      const res = await fetchWithAuth(`/api/reports/export?type=billings`);
      if (!res.ok) throw new Error("Gagal mengunduh file");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_payments_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal melakukan export");
    }
  };

  const filteredPayments = payments.filter(p => 
    p.billingNumber.toLowerCase().includes(search.toLowerCase()) || 
    (p.paymentMethod && p.paymentMethod.toLowerCase().includes(search.toLowerCase())) ||
    (p.paymentChannel && p.paymentChannel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Pembayaran" 
        description="Riwayat semua pembayaran yang diterima"
        action={
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input 
          type="text" 
          placeholder="Cari No. Tagihan atau Metode..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
        />
      </div>

      {loading && <LoadingSkeleton type="list" count={5} />}
      {error && <div className="text-center py-10 text-red-500">Error: {error}</div>}
      {!loading && !error && filteredPayments.length === 0 && (
        <EmptyState 
          icon={CreditCard}
          title="Tidak Ada Pembayaran"
          description={search ? "Tidak ada pembayaran yang cocok dengan pencarian Anda." : "Belum ada riwayat pembayaran yang ditemukan."}
        />
      )}

      {!loading && !error && filteredPayments.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{payment.billingNumber}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">
                      {payment.paymentMethod || "Metode Pembayaran"} 
                      {payment.paymentChannel && ` (${payment.paymentChannel})`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-success font-mono">{formatRupiah(payment.amount)}</p>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {new Date(payment.paidAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
