"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Plus, Search, Tag, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUsage: number | null;
  currentUsage: number;
  validUntil: string | null;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discountType: "percentage",
    discountValue: 0,
    maxUsage: "",
    validUntil: "",
    isActive: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/coupons");
      const json = await res.json();
      if (json.success) {
        setCoupons(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data kupon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxUsage: coupon.maxUsage ? coupon.maxUsage.toString() : "",
        validUntil: coupon.validUntil ? coupon.validUntil.split("T")[0] : "",
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        name: "",
        discountType: "percentage",
        discountValue: 0,
        maxUsage: "",
        validUntil: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingCoupon;
    const url = isEdit ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...formData,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      discountValue: parseFloat(formData.discountValue.toString())
    };

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isEdit ? "Kupon berhasil diubah" : "Kupon berhasil ditambahkan");
        closeModal();
        loadCoupons();
      } else {
        toast.error(json.message || "Gagal menyimpan kupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kupon ini?")) return;
    
    try {
      const res = await fetchWithAuth(`/api/coupons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Kupon berhasil dihapus");
        loadCoupons();
      } else {
        toast.error(json.message || "Gagal menghapus kupon");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan server");
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSkeleton type="table" count={5} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Manajemen Kupon" 
          description="Kelola kode kupon diskon untuk pelanggan."
        />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kupon
        </button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Cari kode atau nama kupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Diskon</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Penggunaan</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Masa Berlaku</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] font-mono">{coupon.code}</p>
                        <p className="text-xs text-[var(--text-muted)]">{coupon.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%` 
                        : formatRupiah(coupon.discountValue)
                      }
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {coupon.currentUsage} {coupon.maxUsage ? `/ ${coupon.maxUsage}` : '(Tak terbatas)'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('id-ID') : 'Selamanya'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {coupon.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/10 text-danger text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openModal(coupon)}
                        className="p-2 text-[var(--text-muted)] hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                        title="Edit Kupon"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-[var(--text-muted)] hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
                        title="Hapus Kupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Tidak ada data kupon ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-semibold text-lg">{editingCoupon ? "Edit Kupon" : "Tambah Kupon Baru"}</h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Kode Kupon *</label>
                <input 
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="Contoh: MERDEKA50"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nama Kupon (Opsional)</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Promo Kemerdekaan"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tipe Diskon *</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nilai Diskon *</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    step={formData.discountType === 'percentage' ? "0.1" : "1"}
                    value={formData.discountValue}
                    onChange={e => setFormData({...formData, discountValue: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Batas Penggunaan</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Tak terbatas"
                    value={formData.maxUsage}
                    onChange={e => setFormData({...formData, maxUsage: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Berlaku Sampai</label>
                  <input 
                    type="date"
                    value={formData.validUntil}
                    onChange={e => setFormData({...formData, validUntil: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-[var(--text-secondary)]">Kupon Aktif</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] mt-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors"
                >
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
