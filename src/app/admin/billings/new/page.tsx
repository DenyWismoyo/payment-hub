"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/useClients";
import { useCatalogs } from "@/hooks/useCatalogs";
import { useSettings } from "@/hooks/useSettings";
import { calculateTaxes, calculateGrandTotal, calculateTaxTotal } from "@/lib/tax/calculator";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { TaxAllocationRule, ClientType } from "@/types";

export default function NewBillingPage() {
  const router = useRouter();
  const { clients, loading: loadingClients } = useClients();
  const { catalogs, loading: loadingCatalogs } = useCatalogs();
  const { settings, isLoading: loadingSettings } = useSettings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0]; // default 7 days from now
  });

  // Tax State
  const [includePpn, setIncludePpn] = useState(true);
  const [includePph23, setIncludePph23] = useState(false);

  // Sync with global settings when loaded
  useEffect(() => {
    if (settings) {
      setIncludePpn(settings.taxEnableDefault ?? true);
      // PPh 23 typically optional, but we can set defaults if needed
    }
  }, [settings]);

  // Derived Data
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedCatalog = catalogs.find((c) => c.id === catalogItemId);

  const subtotal = useMemo(() => {
    if (!selectedCatalog) return 0;
    return (selectedCatalog.price || 0) * qty;
  }, [selectedCatalog, qty]);

  const taxRules = useMemo(() => {
    const rules: TaxAllocationRule[] = [];
    if (includePpn) {
      const ppnRate = settings?.taxPpnRate ?? 12;
      rules.push({
        taxType: "ppn",
        name: `PPN ${ppnRate}%`,
        percentage: ppnRate,
        isInclusive: false,
        appliesTo: "all",
        description: `Pajak Pertambahan Nilai ${ppnRate}%`,
      });
    }
    if (includePph23) {
      const pph23Rate = settings?.taxPph23Rate ?? -2;
      rules.push({
        taxType: "pph23",
        name: `PPh 23 (${Math.abs(pph23Rate)}%)`,
        percentage: pph23Rate, // Negatif karena memotong tagihan
        isInclusive: false,
        appliesTo: "all",
        description: "Pajak Penghasilan Pasal 23",
      });
    }
    return rules;
  }, [includePpn, includePph23, settings]);

  const taxDetails = useMemo(() => {
    return calculateTaxes(subtotal, taxRules, selectedClient?.type || "private");
  }, [subtotal, taxRules, selectedClient]);

  const taxTotal = useMemo(() => calculateTaxTotal(taxDetails), [taxDetails]);
  const grandTotal = useMemo(() => calculateGrandTotal(subtotal, taxDetails), [subtotal, taxDetails]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !catalogItemId) {
      setError("Mohon pilih klien dan produk.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        clientId,
        catalogItemId,
        qty,
        notes,
        dueDate: new Date(dueDate).toISOString(),
        subtotal,
        taxDetails,
        taxTotal,
        grandTotal,
      };

      const res = await fetchWithAuth("/api/billings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat tagihan");
      }

      // Success
      router.push("/admin/billings");
      router.refresh();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
      setIsSubmitting(false);
    }
  };

  if (loadingClients || loadingCatalogs || loadingSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Buat Tagihan Baru</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Buat invoice dan link pembayaran melalui Mayar.id</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-2 space-y-6">
          <form id="billing-form" onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-2xl shadow-sm border border-[var(--border)] space-y-6">
            
            {/* Klien */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Pilih Klien</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                <option value="">-- Pilih Klien --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === "government" ? "Pemerintah" : "Swasta"})
                  </option>
                ))}
              </select>
            </div>

            {/* Produk */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Katalog Produk/Layanan</label>
              <select
                required
                value={catalogItemId}
                onChange={(e) => setCatalogItemId(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              >
                <option value="">-- Pilih Layanan --</option>
                {catalogs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {formatCurrency(c.price || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Kuantitas */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Kuantitas</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Jatuh Tempo */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Pengaturan Pajak */}
            <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-xl space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Pengaturan Pajak</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePpn}
                  onChange={(e) => setIncludePpn(e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-[var(--border)] bg-[var(--background)] focus:ring-primary"
                />
                <span className="text-[var(--text-secondary)]">Tambahkan PPN {settings?.taxPpnRate ?? 12}% (Eksklusif)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePph23}
                  onChange={(e) => setIncludePph23(e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-[var(--border)] bg-[var(--background)] focus:ring-primary"
                />
                <span className="text-[var(--text-secondary)]">Potong PPh 23 ({Math.abs(settings?.taxPph23Rate ?? -2)}%)</span>
              </label>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Catatan (Opsional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk klien..."
                className="w-full px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
          </form>
        </div>

        {/* SUMMARY / PREVIEW */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-blue-900 to-indigo-900 p-6 rounded-2xl shadow-lg text-white sticky top-24">
            <h3 className="text-lg font-bold mb-4 opacity-90">Ringkasan Tagihan</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start text-sm">
                <span className="text-blue-200">Klien</span>
                <span className="font-medium text-right">{selectedClient?.name || "-"}</span>
              </div>
              <div className="flex justify-between items-start text-sm">
                <span className="text-blue-200">Layanan</span>
                <span className="font-medium text-right truncate ml-4">{selectedCatalog?.name || "-"}</span>
              </div>
              
              <hr className="border-blue-800 my-4" />

              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-200">Subtotal ({qty}x)</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {taxDetails.map((tax, i) => (
                <div key={i} className="flex justify-between items-center text-sm text-blue-300">
                  <span>{tax.name}</span>
                  <span>{tax.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(tax.amount))}</span>
                </div>
              ))}

              <hr className="border-blue-800 my-4" />

              <div className="flex justify-between items-center">
                <span className="text-blue-100 font-medium">Grand Total</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="billing-form"
              disabled={isSubmitting || !clientId || !catalogItemId}
              className="mt-8 w-full bg-white text-blue-900 font-semibold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900"></div>
                  Memproses...
                </>
              ) : (
                "Terbitkan Tagihan"
              )}
            </button>
            <p className="text-xs text-center text-blue-300 mt-4">
              Akan membuat link pembayaran via Mayar.id
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
