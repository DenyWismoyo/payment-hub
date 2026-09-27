"use client";

import { Plus, Search, Filter, Download, Clock, ArrowUpDown, CopyPlus, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useBillings } from "@/hooks/useBillings";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText } from "lucide-react";

const clientTypeConfig: Record<string, { label: string; class: string }> = {
  government: { label: "Pemerintah", class: "bg-blue-500/10 text-blue-400" },
  private: { label: "Swasta", class: "bg-violet-500/10 text-violet-400" },
  individual: { label: "Perorangan", class: "bg-amber-500/10 text-amber-400" },
};

export default function BillingsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [debouncedSearch, status]);

  const { billings, pagination, loading, error } = useBillings({
    page,
    limit,
    status,
    search: debouncedSearch
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Tagihan" 
        description="Kelola semua tagihan yang telah diterbitkan"
        action={
          <>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
            <Link
              href="/admin/billings/batch"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all hover:-translate-y-0.5"
            >
              <CopyPlus className="w-4 h-4" />
              Tagihan Massal
            </Link>
            <Link
              href="/admin/billings/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Buat Tagihan
            </Link>
          </>
        }
      />

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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
        >
          <option value="all">Semua Status</option>
          <option value="issued">Issued</option>
          <option value="paid">Lunas</option>
          <option value="overdue">Jatuh Tempo</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* States */}
      {loading && <LoadingSkeleton type="table" count={5} />}
      {error && <div className="text-center text-red-500 py-10">Error: {error}</div>}
      {!loading && !error && billings.length === 0 && (
        <EmptyState 
          icon={FileText}
          title="Tidak Ada Tagihan"
          description={search ? "Tidak ada tagihan yang cocok dengan pencarian Anda." : "Belum ada tagihan. Silakan buat tagihan baru untuk klien Anda."}
          action={
            <Link
              href="/admin/billings/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Tagihan Pertama
            </Link>
          }
        />
      )}

      {/* Billings Table */}
      {!loading && !error && billings.length > 0 && (
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
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-3">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {billings.map((billing) => (
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
                      <StatusBadge status={billing.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(billing.dueDate).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right flex justify-end">
                      {billing.mayarPaymentUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(billing.mayarPaymentUrl!);
                            toast.success("Payment Link berhasil disalin!");
                          }}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Copy Payment Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--text-muted)]">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} tagihan
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        pagination.page === i + 1 
                          ? "bg-primary text-white" 
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
