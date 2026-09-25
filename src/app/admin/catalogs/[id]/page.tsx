"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Package, Plus, MoreVertical, CheckCircle2, XCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { formatRupiah } from "@/lib/utils";
import type { Catalog, CatalogItem } from "@/types";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogItemModal } from "@/components/catalog/CatalogItemModal";

export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Items state
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/catalogs/${id}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memuat katalog");
      }
      
      setCatalog(json.data);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCatalog();
      fetchItems();
    }
  }, [id]);

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const res = await fetchWithAuth(`/api/catalogs/${id}/items`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat item katalog", err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus katalog ini? Semua item di dalamnya (jika ada) mungkin akan terpengaruh.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetchWithAuth(`/api/catalogs/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal menghapus katalog");
      }
      
      router.push("/admin/catalogs");
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : String(err)));
      setIsDeleting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Hapus item ini?")) return;
    try {
      const res = await fetchWithAuth(`/api/catalogs/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      fetchItems();
      fetchCatalog(); // Refresh catalog to update itemCount
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) return <div className="text-center py-10 text-[var(--text-muted)]">Memuat data katalog...</div>;
  if (error || !catalog) return <div className="text-center py-10 text-red-500">Error: {error || "Katalog tidak ditemukan"}</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/catalogs"
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${catalog.color} flex items-center justify-center text-xl shadow-lg`}>
              {catalog.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{catalog.name}</h1>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {catalog.category}
                </span>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
              Informasi Katalog
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Deskripsi</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {catalog.description || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Dibuat Pada</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {new Date(catalog.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Item Katalog
              </h2>
              <button 
                onClick={() => { setSelectedItem(null); setIsItemModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Item
              </button>
            </div>
            
            {itemsLoading ? (
               <div className="text-center py-10 text-[var(--text-muted)]">Memuat item...</div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--border-light)] flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-[var(--text-primary)] font-medium mb-1">Belum Ada Item</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                  Katalog ini belum memiliki item layanan. Silakan tambah item baru.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-light)] transition-colors flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">{item.name}</h3>
                        {item.isActive ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">Aktif</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">Nonaktif</span>
                        )}
                        {item.taxConfig?.isEnabled && (
                           <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">Pajak Khusus</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{formatRupiah(item.price)}</p>
                      {item.description && <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CatalogModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchCatalog();
        }}
        catalog={catalog}
      />

      <CatalogItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => {
          setIsItemModalOpen(false);
          fetchItems();
          fetchCatalog(); // Refresh count
        }}
        catalogId={id}
        item={selectedItem}
      />
    </div>
  );
}
