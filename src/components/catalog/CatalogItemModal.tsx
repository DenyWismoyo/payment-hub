"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { CatalogItem, TaxAllocationRule, TaxConfig, TaxType, ClientType, BillingType } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface CatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  catalogId: string;
  item?: CatalogItem | null;
}

const defaultTaxRule: TaxAllocationRule = {
  taxType: "ppn",
  name: "PPN 11%",
  percentage: 11,
  isInclusive: false,
  appliesTo: "all",
  description: "",
};

export function CatalogItemModal({ isOpen, onClose, onSuccess, catalogId, item }: CatalogItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    currency: string;
    billingType: BillingType;
    isActive: boolean;
    taxConfig: TaxConfig;
  }>({
    name: "",
    description: "",
    price: "",
    currency: "IDR",
    billingType: "one_time",
    isActive: true,
    taxConfig: { isEnabled: false, allocations: [] },
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        currency: item.currency || "IDR",
        billingType: item.billingType || "one_time",
        isActive: item.isActive,
        taxConfig: item.taxConfig || { isEnabled: false, allocations: [] },
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        currency: "IDR",
        billingType: "one_time",
        isActive: true,
        taxConfig: { isEnabled: false, allocations: [] },
      });
    }
    setError(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = item 
        ? `/api/catalogs/${catalogId}/items/${item.id}` 
        : `/api/catalogs/${catalogId}/items`;
      const method = item ? "PUT" : "POST";

      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan item katalog");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const addTaxRule = () => {
    setFormData({
      ...formData,
      taxConfig: {
        ...formData.taxConfig,
        allocations: [...formData.taxConfig.allocations, { ...defaultTaxRule }],
      }
    });
  };

  const removeTaxRule = (index: number) => {
    const newAllocations = [...formData.taxConfig.allocations];
    newAllocations.splice(index, 1);
    setFormData({
      ...formData,
      taxConfig: { ...formData.taxConfig, allocations: newAllocations },
    });
  };

  const updateTaxRule = (index: number, field: keyof TaxAllocationRule, value: TaxAllocationRule[keyof TaxAllocationRule]) => {
    const newAllocations = [...formData.taxConfig.allocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setFormData({
      ...formData,
      taxConfig: { ...formData.taxConfig, allocations: newAllocations },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {item ? "Edit Item" : "Tambah Item"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-light)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl shrink-0">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Informasi Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Nama Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Contoh: Paket Premium 1 Bulan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Contoh: 1500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Tipe Tagihan
                </label>
                <select
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value as BillingType })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  <option value="one_time">Sekali Bayar (One Time)</option>
                  <option value="recurring">Berlangganan (Recurring)</option>
                  <option value="installment">Cicilan (Installment)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Deskripsi spesifik mengenai layanan ini..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-[var(--background)] border-[var(--border)]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[var(--text-primary)]">
                  Item Aktif
                </label>
              </div>
            </div>
          </div>

          {/* Tax Config */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Konfigurasi Pajak Khusus
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={formData.taxConfig.isEnabled}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    taxConfig: { ...formData.taxConfig, isEnabled: e.target.checked }
                  })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-[var(--background)] border-[var(--border)]"
                />
                <label htmlFor="taxEnabled" className="text-sm font-medium text-[var(--text-secondary)]">
                  Aktifkan Pajak
                </label>
              </div>
            </div>

            {formData.taxConfig.isEnabled && (
              <div className="space-y-4">
                {formData.taxConfig.allocations.length === 0 ? (
                  <div className="text-center py-4 bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
                    Belum ada aturan pajak. Klik tombol di bawah untuk menambah.
                  </div>
                ) : (
                  formData.taxConfig.allocations.map((rule, index) => (
                    <div key={index} className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => removeTaxRule(index)}
                        className="absolute right-2 top-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pr-6">
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Nama Aturan</label>
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => updateTaxRule(index, "name", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tipe</label>
                          <select
                            value={rule.taxType}
                            onChange={(e) => updateTaxRule(index, "taxType", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                          >
                            <option value="ppn">PPN</option>
                            <option value="pph23">PPh 23</option>
                            <option value="pph21">PPh 21</option>
                            <option value="pph4_2">PPh 4(2)</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Persentase (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={rule.percentage}
                            onChange={(e) => updateTaxRule(index, "percentage", parseFloat(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Berlaku Untuk</label>
                          <select
                            value={rule.appliesTo}
                            onChange={(e) => updateTaxRule(index, "appliesTo", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                          >
                            <option value="all">Semua Client</option>
                            <option value="government">Pemerintah</option>
                            <option value="private">Swasta</option>
                            <option value="individual">Individu</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`inclusive-${index}`}
                          checked={rule.isInclusive}
                          onChange={(e) => updateTaxRule(index, "isInclusive", e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-primary border-[var(--border)] bg-[var(--surface)]"
                        />
                        <label htmlFor={`inclusive-${index}`} className="text-xs text-[var(--text-secondary)]">
                          Inclusive (Pajak dipotong dari total harga, bukan ditambahkan)
                        </label>
                      </div>
                    </div>
                  ))
                )}
                
                <button
                  type="button"
                  onClick={addTaxRule}
                  className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Aturan Pajak
                </button>
              </div>
            )}
          </div>
        </form>

        <div className="p-5 flex justify-end gap-3 border-t border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
