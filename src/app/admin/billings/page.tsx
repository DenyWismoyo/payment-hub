"use client";

import { Plus, Search, Filter, Download, Clock, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import { useState } from "react";
import { useBillings } from "@/hooks/useBillings";

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  issued: { label: "Diterbitkan", class: "bg-info/10 text-info border-info/20" },
  sent: { label: "Terkirim", class: "bg-secondary/10 text-secondary border-secondary/20" },
  paid: { label: "Lunas", class: "bg-success/10 text-success border-success/20" },
  overdue: { label: "Jatuh Tempo", class: "bg-danger/10 text-danger border-danger/20" },
  cancelled: { label: "Dibatalkan", class: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const clientTypeConfig: Record<string, { label: string; class: string }> = {
  government: { label: "Pemerintah", class: "bg-blue-500/10 text-blue-400" },
  private: { label: "Swasta", class: "bg-violet-500/10 text-violet-400" },
  individual: { label: "Perorangan", class: "bg-amber-500/10 text-amber-400" },
};

export default function BillingsPage() {
  const { billings, loading, error } = useBillings();
  const [search, setSearch] = useState("");

  const filteredBillings = billings.filter(b => 
    b.billingNumber?.toLowerCase().includes(search.toLowerCase()) || 
    b.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    b.accessCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tagihan</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola semua tagihan yang telah diterbitkan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link
            href="/admin/billings/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Buat Tagihan
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari nomor tagihan, klien, atau kode akses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all">
          <ArrowUpDown className="w-4 h-4" />
          Urutkan
        </button>
      </div>

      {/* States */}
      {loading && <div className="text-center text-[var(--text-muted)] py-10">Memuat tagihan...</div>}
      {error && <div className="text-center text-red-500 py-10">Error: {error}</div>}
      {!loading && !error && filteredBillings.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-10">
          Belum ada tagihan. Silakan buat tagihan baru.
        </div>
      )}

      {/* Billings Table */}
      {!loading && !error && filteredBillings.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    No. Tagihan
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Klien
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Produk
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Kode Akses
                  </th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Jumlah
                  </th>
                  <th className="text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Jatuh Tempo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredBillings.map((billing) => (
                  <tr
                    key={billing.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/billings/${billing.id}`}
                        className="text-sm font-medium text-primary hover:text-primary-light font-mono"
                      >
                        {billing.billingNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <p className="text-sm text-[var(--text-primary)] truncate max-w-[200px]">
                          {billing.clientName}
                        </p>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            clientTypeConfig[billing.clientType]?.class || clientTypeConfig.individual.class
                          }`}
                        >
                          {clientTypeConfig[billing.clientType]?.label || billing.clientType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-[var(--text-secondary)] truncate max-w-[180px]">
                        {billing.catalogItemName}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <code className="text-xs font-mono px-2 py-1 rounded-lg bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)]">
                        {billing.accessCode}
                      </code>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                        {formatRupiah(billing.grandTotal)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          statusConfig[billing.status]?.class || statusConfig.issued.class
                        }`}
                      >
                        {statusConfig[billing.status]?.label || billing.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(billing.dueDate).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
