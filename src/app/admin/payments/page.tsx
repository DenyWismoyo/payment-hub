"use client";

import { CreditCard, Search, Download, Clock } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const demoPayments = [
  { id: "1", billingNumber: "INV-2026-0047", client: "Dinas Kesehatan Kab. Garut", amount: 5500000, method: "Bank Transfer", channel: "BCA", paidAt: "25 Sep 2026, 10:30" },
  { id: "2", billingNumber: "INV-2026-0045", client: "Badan Kepegawaian Daerah", amount: 7800000, method: "Virtual Account", channel: "Mandiri", paidAt: "23 Sep 2026, 14:15" },
  { id: "3", billingNumber: "INV-2026-0043", client: "Dinas Pendidikan Kota Bandung", amount: 12000000, method: "QRIS", channel: "GoPay", paidAt: "19 Sep 2026, 09:45" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pembayaran</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Riwayat semua pembayaran yang diterima</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--surface-hover)] transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" placeholder="Cari pembayaran..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
      </div>

      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
        {demoPayments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{payment.client}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-primary font-mono">{payment.billingNumber}</span>
                  <span className="text-xs text-[var(--text-muted)]">· {payment.method} ({payment.channel})</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-success font-mono">{formatRupiah(payment.amount)}</p>
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{payment.paidAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
