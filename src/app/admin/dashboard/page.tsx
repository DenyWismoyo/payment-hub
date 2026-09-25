"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

const statusConfig: Record<string, { label: string; class: string }> = {
  paid: { label: "Lunas", class: "bg-success/10 text-success border-success/20" },
  pending: { label: "Menunggu", class: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Jatuh Tempo", class: "bg-danger/10 text-danger border-danger/20" },
};

const icons = {
  Wallet,
  FileText,
  CheckCircle2,
  AlertTriangle,
};
const colors = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const { stats, recentTransactions, catalogBreakdown } = data || { stats: [], recentTransactions: [], catalogBreakdown: [] };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Selamat datang kembali! Berikut ringkasan pembayaran Anda.
        </p>
      </div>

      {/* ─── Stats Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat: any, idx: number) => {
          const Icon = Object.values(icons)[idx] || Wallet;
          const color = colors[idx] || colors[0];
          return (
            <div
              key={stat.label}
              className="group relative p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-light)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                {stat.label.includes("Pendapatan") ? formatRupiah(stat.value) : stat.value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Main Content Grid ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-[var(--text-primary)]">
                Transaksi Terbaru
              </h2>
            </div>
            <Link
              href="/admin/billings"
              className="text-xs text-primary hover:text-primary-light font-medium flex items-center gap-1 transition-colors"
            >
              Lihat Semua
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] font-mono">
                        {tx.id}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          statusConfig[tx.status]?.class
                        }`}
                      >
                        {statusConfig[tx.status]?.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {tx.client} · {tx.product}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                    {formatRupiah(tx.amount)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {tx.date}
                  </p>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">Belum ada transaksi.</div>
            )}
          </div>
        </div>

        {/* Catalog Breakdown */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-[var(--text-primary)]">
                Per Katalog (Lunas)
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {catalogBreakdown.map((item: any) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {item.percentage}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                  {formatRupiah(item.amount)}
                </p>
              </div>
            ))}
            {catalogBreakdown.length === 0 && (
              <div className="text-center text-gray-500 text-sm">Belum ada data.</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="border-t border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Keterangan</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Hanya menghitung tagihan yang telah dilunasi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
