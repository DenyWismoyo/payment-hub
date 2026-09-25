"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Building2, Briefcase, User, Mail, Phone, MapPin, ReceiptText } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Client, Billing } from "@/types";
import { ClientModal } from "@/components/client/ClientModal";
import { formatRupiah, getStatusColor, getStatusLabel } from "@/lib/utils";

const typeIcons: Record<string, typeof Building2> = { government: Building2, private: Briefcase, individual: User };
const typeLabels: Record<string, string> = { government: "Pemerintah", private: "Swasta", individual: "Perorangan" };
const typeColors: Record<string, string> = { government: "from-blue-500 to-indigo-600", private: "from-violet-500 to-purple-600", individual: "from-amber-500 to-orange-600" };

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      // Fetch Client
      const resClient = await fetchWithAuth(`/api/clients/${id}`);
      const jsonClient = await resClient.json();
      if (!resClient.ok || !jsonClient.success) {
        throw new Error(jsonClient.message || "Gagal memuat klien");
      }
      setClient(jsonClient.data);

      // Fetch Client Billings
      // Note: we can filter client billings directly via query if the API supports it, 
      // or fetch all and filter. Given Firebase, we can fetch all billings and filter by clientId, 
      // but let's do a simple filter here or assume /api/billings?clientId=... works.
      // Currently /api/billings doesn't have query params implemented in our basic version.
      // We'll fetch all and filter client side for now.
      const resBillings = await fetchWithAuth("/api/billings");
      const jsonBillings = await resBillings.json();
      if (resBillings.ok && jsonBillings.success) {
        const clientBillings = jsonBillings.data.filter((b: Billing) => b.clientId === id);
        setBillings(clientBillings);
      }

    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Hapus klien ini secara permanen?")) return;

    try {
      setIsDeleting(true);
      const res = await fetchWithAuth(`/api/clients/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus klien");
      }
      
      router.push("/admin/clients");
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : String(err)));
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-[var(--text-muted)]">Memuat data klien...</div>;
  if (error || !client) return <div className="text-center py-10 text-red-500">Error: {error || "Klien tidak ditemukan"}</div>;

  const Icon = typeIcons[client.type] || User;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/clients"
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[client.type] || typeColors.individual} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{client.name}</h1>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {typeLabels[client.type] || client.type}
                </span>
                {client.organization && client.organization !== "-" && (
                  <span className="text-[var(--text-muted)] text-xs font-medium">
                    {client.organization}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:border-primary/50 transition-all shadow-sm hover:shadow"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Informasi Kontak
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Email</p>
                  <p className="text-sm text-[var(--text-primary)]">{client.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Nomor Telepon</p>
                  <p className="text-sm text-[var(--text-primary)]">{client.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">Alamat</p>
                  <p className="text-sm text-[var(--text-primary)]">{client.address || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ReceiptText className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-0.5">NPWP</p>
                  <p className="text-sm text-[var(--text-primary)] font-mono">{client.npwp || "-"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Statistik Keuangan
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Transaksi Selesai</p>
                <p className="text-xl font-bold text-success font-mono">
                  {formatRupiah(billings.filter(b => b.status === "paid").reduce((acc, b) => acc + b.grandTotal, 0))}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Belum Dibayar</p>
                <p className="text-xl font-bold text-warning font-mono">
                  {formatRupiah(billings.filter(b => ["issued", "sent", "overdue", "partially_paid"].includes(b.status)).reduce((acc, b) => acc + b.grandTotal, 0))}
                </p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)]">Jumlah Tagihan</span>
                <span className="font-semibold text-[var(--text-primary)]">{billings.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Riwayat Tagihan
              </h2>
              <Link 
                href={`/admin/billings/new?clientId=${client.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Buat Tagihan Baru
              </Link>
            </div>
            
            {billings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--border-light)] flex items-center justify-center mb-4">
                  <ReceiptText className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Belum Ada Tagihan</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                  Klien ini belum memiliki riwayat tagihan.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {billings.map(billing => {
                  const statusColor = getStatusColor(billing.status);
                  const statusLabel = getStatusLabel(billing.status);
                  
                  return (
                    <Link 
                      key={billing.id} 
                      href={`/admin/billings/${billing.id}`}
                      className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-mono text-[var(--text-muted)] group-hover:text-primary transition-colors">
                            {billing.billingNumber}
                          </p>
                          <h4 className="font-medium text-sm text-[var(--text-primary)] mt-0.5">
                            {billing.catalogItemName}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end mt-3">
                        <div className="text-xs text-[var(--text-muted)]">
                          Jatuh Tempo: {new Date(billing.dueDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </div>
                        <div className="font-semibold text-[var(--text-primary)] font-mono">
                          {formatRupiah(billing.grandTotal)}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchClientData();
        }}
        client={client}
      />
    </div>
  );
}
