"use client";

import { useState } from "react";
import useSWR from "swr";
import { Repeat, Search, Plus, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Subscription } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SubscriptionsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Subscription[] }>("/api/subscriptions", fetcher);
  const [searchTerm, setSearchTerm] = useState("");

  const subscriptions = data?.data || [];
  
  const filteredSubs = subscriptions.filter(sub => 
    sub.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.catalogItemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "paused": return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";
      default: return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200 dark:border-zinc-700";
    }
  };

  const getCycleBadge = (cycle: string) => {
    switch (cycle) {
      case "monthly": return "Bulanan";
      case "quarterly": return "Kuartalan (3 Bln)";
      case "yearly": return "Tahunan";
      default: return cycle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Manajemen Langganan</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola tagihan berulang dan siklus pembayaran klien
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Langganan Baru</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari langganan, klien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Klien & Item</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Siklus & Harga</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Jatuh Tempo Berikutnya</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center">
                      <Repeat className="w-8 h-8 animate-spin-slow mb-4 opacity-50" />
                      <p>Memuat data langganan...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-danger">Gagal memuat data</td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Tidak ada data langganan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{sub.clientName}</span>
                        <span className="text-xs text-[var(--text-secondary)] mt-0.5">{sub.catalogItemName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{formatRupiah(sub.amount)}</span>
                        <span className="text-xs text-[var(--text-muted)] mt-0.5">{getCycleBadge(sub.cycle)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Calendar className="w-4 h-4 text-primary opacity-70" />
                        {new Date(sub.nextBillingDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-[var(--text-muted)] hover:text-primary transition-colors bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg border border-transparent hover:border-[var(--border)]" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-danger transition-colors bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg border border-transparent hover:border-[var(--border)]" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
