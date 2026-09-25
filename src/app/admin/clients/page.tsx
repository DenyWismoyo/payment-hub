"use client";

import { Users, Plus, Search, Building2, Briefcase, User } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { useClients } from "@/hooks/useClients";
import { ClientModal } from "@/components/client/ClientModal";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

const typeIcons: Record<string, typeof Building2> = { government: Building2, private: Briefcase, individual: User };
const typeLabels: Record<string, string> = { government: "Pemerintah", private: "Swasta", individual: "Perorangan" };
const typeColors: Record<string, string> = { government: "from-blue-500 to-indigo-600", private: "from-violet-500 to-purple-600", individual: "from-amber-500 to-orange-600" };

export default function ClientsPage() {
  const { clients, loading, error, refetch } = useClients();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Klien" 
        description="Kelola data klien pemerintah, swasta, dan perorangan"
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Klien
          </button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input 
          type="text" 
          placeholder="Cari klien..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
        />
      </div>

      {/* States */}
      {loading && <LoadingSkeleton type="card" count={6} />}
      {error && <div className="text-center text-red-500 py-10">Error: {error}</div>}
      {!loading && !error && filteredClients.length === 0 && (
        <EmptyState 
          icon={Users}
          title="Tidak Ada Klien"
          description={search ? "Tidak ada klien yang cocok dengan pencarian Anda." : "Belum ada klien. Silakan tambahkan klien baru."}
          action={
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Klien Pertama
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const Icon = typeIcons[client.type] || Users;
          return (
            <Link key={client.id} href={`/admin/clients/${client.id}`} className="group p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-light)] hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg block cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeColors[client.type] || typeColors.individual} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">{client.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] truncate">{client.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {typeLabels[client.type] || client.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Total Tagihan</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{client.totalBillings}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--text-muted)]">Total Dibayar</p>
                  <p className="text-sm font-semibold text-success font-mono">{formatRupiah(client.totalPaid)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
