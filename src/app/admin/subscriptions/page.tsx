"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Repeat, Search, Plus, Calendar, MoreVertical, Edit, Trash2, XCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { Subscription, Client, Catalog, CatalogItem } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

const fetcher = (url: string) => fetchWithAuth(url).then((res) => res.json());

export default function SubscriptionsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Subscription[] }>("/api/subscriptions", fetcher);
  
  // Need to fetch clients and catalogs for the form
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [formData, setFormData] = useState({
    clientId: "",
    catalogId: "", // Just for selection
    catalogItemId: "",
    cycle: "monthly",
    amount: 0,
    nextBillingDate: "",
    status: "active"
  });

  useEffect(() => {
    // Fetch clients and catalogs
    const loadDependencies = async () => {
      try {
        const [clientRes, catalogRes] = await Promise.all([
          fetchWithAuth("/api/clients").then(r => r.json()),
          fetchWithAuth("/api/catalogs").then(r => r.json())
        ]);
        if (clientRes.success) setClients(clientRes.data);
        if (catalogRes.success) setCatalogs(catalogRes.data);
      } catch (e) {
        console.error("Failed to load dependencies", e);
      }
    };
    loadDependencies();
  }, []);

  // Fetch catalog items when catalog changes
  useEffect(() => {
    if (formData.catalogId) {
      fetchWithAuth(`/api/catalogs/${formData.catalogId}`)
        .then(r => r.json())
        .then(json => {
          if (json.success && json.data.items) {
            setCatalogItems(json.data.items);
          }
        });
    } else {
      setCatalogItems([]);
    }
  }, [formData.catalogId]);

  const subscriptions = data?.data || [];
  
  const filteredSubs = subscriptions.filter(sub => 
    sub.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.catalogItemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "paused": return "bg-amber-100 text-amber-700 border-amber-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
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

  const openModal = (sub?: Subscription) => {
    if (sub) {
      setEditingSub(sub);
      setFormData({
        clientId: sub.clientId,
        catalogId: "", // Hard to map back unless we know the catalogId of the item
        catalogItemId: sub.catalogItemId,
        cycle: sub.cycle,
        amount: sub.amount,
        nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : "",
        status: sub.status
      });
    } else {
      setEditingSub(null);
      setFormData({
        clientId: "",
        catalogId: "",
        catalogItemId: "",
        cycle: "monthly",
        amount: 0,
        nextBillingDate: new Date().toISOString().split('T')[0],
        status: "active"
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingSub;
    const url = isEdit ? `/api/subscriptions/${editingSub.id}` : "/api/subscriptions";
    const method = isEdit ? "PUT" : "POST";

    const client = clients.find(c => c.id === formData.clientId);
    // If we are editing and didn't change catalog, catalogItems might be empty
    const item = catalogItems.find(i => i.id === formData.catalogItemId) || 
                 (editingSub ? { id: editingSub.catalogItemId, name: editingSub.catalogItemName } : null);

    if (!client || !item) {
      toast.error("Klien atau Item Katalog tidak valid");
      return;
    }

    const payload = {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      catalogItemId: item.id,
      catalogItemName: item.name,
      cycle: formData.cycle,
      amount: Number(formData.amount),
      nextBillingDate: new Date(formData.nextBillingDate).toISOString(),
      status: formData.status
    };

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isEdit ? "Langganan berhasil diubah" : "Langganan berhasil ditambahkan");
        closeModal();
        mutate();
      } else {
        toast.error(json.message || "Gagal menyimpan langganan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus langganan ini?")) return;
    
    try {
      const res = await fetchWithAuth(`/api/subscriptions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Langganan berhasil dihapus");
        mutate();
      } else {
        toast.error(json.message || "Gagal menghapus langganan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan server");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Manajemen Langganan</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola tagihan berulang dan siklus pembayaran klien
          </p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Langganan Baru</span>
        </button>
      </div>

      <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari langganan, klien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none transition-all text-sm"
          />
        </div>
      </div>

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
                    <LoadingSkeleton type="table" count={3} />
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
                        <button onClick={() => openModal(sub)} className="p-2 text-[var(--text-muted)] hover:text-primary transition-colors hover:bg-primary/10 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-2 text-[var(--text-muted)] hover:text-danger transition-colors hover:bg-danger/10 rounded-lg" title="Hapus">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-semibold text-lg">{editingSub ? "Edit Langganan" : "Langganan Baru"}</h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Klien *</label>
                <select 
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                  disabled={!!editingSub}
                >
                  <option value="">-- Pilih Klien --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {!editingSub && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Katalog *</label>
                    <select 
                      required
                      value={formData.catalogId}
                      onChange={e => setFormData({...formData, catalogId: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                    >
                      <option value="">-- Pilih Katalog --</option>
                      {catalogs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Item Katalog *</label>
                    <select 
                      required
                      value={formData.catalogItemId}
                      onChange={e => {
                        const item = catalogItems.find(i => i.id === e.target.value);
                        setFormData({
                          ...formData, 
                          catalogItemId: e.target.value,
                          amount: item ? item.price : 0
                        });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                      disabled={!formData.catalogId}
                    >
                      <option value="">-- Pilih Item --</option>
                      {catalogItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Siklus *</label>
                  <select 
                    required
                    value={formData.cycle}
                    onChange={e => setFormData({...formData, cycle: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Kuartalan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Harga *</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tanggal Mulai/Jatuh Tempo *</label>
                  <input 
                    type="date"
                    required
                    value={formData.nextBillingDate}
                    onChange={e => setFormData({...formData, nextBillingDate: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status *</label>
                  <select 
                    required
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="paused">Jeda (Paused)</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
