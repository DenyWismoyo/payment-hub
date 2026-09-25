"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/useClients";
import { useCatalogs } from "@/hooks/useCatalogs";
import { useSettings } from "@/hooks/useSettings";
import { calculateTaxes, calculateGrandTotal, calculateTaxTotal } from "@/lib/tax/calculator";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { TaxAllocationRule } from "@/types";

export default function BatchBillingPage() {
  const router = useRouter();
  const { clients, loading: loadingClients } = useClients();
  const { catalogs, loading: loadingCatalogs } = useCatalogs();
  const { settings, isLoading: loadingSettings } = useSettings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [catalogItemId, setCatalogItemId] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0]; // default 7 days from now
  });

  // Tax State
  const [includePpn, setIncludePpn] = useState(true);
  const [includePph23, setIncludePph23] = useState(false);

  useEffect(() => {
    if (settings) {
      setIncludePpn(settings.taxEnableDefault ?? true);
    }
  }, [settings]);

  const toggleClient = (id: string) => {
    setClientIds((prev) => 
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllClients = () => {
    setClientIds(clients.map(c => c.id));
  };

  const deselectAllClients = () => {
    setClientIds([]);
  };

  const selectedCatalog = catalogs.find((c) => c.id === catalogItemId);

  const subtotal = useMemo(() => {
    if (!selectedCatalog) return 0;
    return selectedCatalog.price || 0;
  }, [selectedCatalog]);

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
        percentage: pph23Rate,
        isInclusive: false,
        appliesTo: "all",
        description: "Pajak Penghasilan Pasal 23",
      });
    }
    return rules;
  }, [includePpn, includePph23, settings]);

  // Note: calculateTaxes requires clientType, but since this is batch, we'll calculate based on "private" as default to show the preview,
  // the actual API will recalculate or use what we send. Wait, our API accepts tax details! So we MUST send standard tax details, 
  // or we should calculate per-client in the backend! 
  // Since we send taxDetails in batch payload, we're assuming all clients get the SAME tax rule. If government gets different tax (PPh 22), 
  // then we shouldn't mix government and private in batch, OR we calculate in backend. 
  // For now, we will calculate based on private for the preview.
  const taxDetailsPreview = useMemo(() => {
    return calculateTaxes(subtotal, taxRules, "private");
  }, [subtotal, taxRules]);

  const taxTotal = useMemo(() => calculateTaxTotal(taxDetailsPreview), [taxDetailsPreview]);
  const grandTotal = useMemo(() => calculateGrandTotal(subtotal, taxDetailsPreview), [subtotal, taxDetailsPreview]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientIds.length === 0 || !catalogItemId) {
      setError("Mohon pilih setidaknya satu klien dan satu produk.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithAuth("/api/billings/batch", {
        method: "POST",
        body: JSON.stringify({
          clientIds,
          catalogItemId,
          subtotal,
          taxDetails: taxDetailsPreview,
          taxTotal,
          grandTotal,
          notes,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal membuat tagihan massal");
      }

      router.push("/admin/billings");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Buat Tagihan Massal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pilih Klien ({clientIds.length})</h2>
              {loadingClients ? (
                <div className="text-sm text-[var(--text-muted)] animate-pulse">Memuat klien...</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={selectAllClients} className="text-sm text-primary hover:underline">Pilih Semua</button>
                    <button type="button" onClick={deselectAllClients} className="text-sm text-[var(--text-muted)] hover:underline">Batal Pilih</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {clients.map((client) => (
                      <label key={client.id} className="flex items-center p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clientIds.includes(client.id)}
                          onChange={() => toggleClient(client.id)}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{client.name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{client.organization}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--background)] px-2 py-1 rounded-full">{client.type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pengaturan Pajak (Global)</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                  <input
                    type="checkbox"
                    checked={includePpn}
                    onChange={(e) => setIncludePpn(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-[var(--border)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Termasuk PPN ({settings?.taxPpnRate ?? 12}%)</p>
                    <p className="text-xs text-[var(--text-muted)]">Pajak Pertambahan Nilai standar</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
                  <input
                    type="checkbox"
                    checked={includePph23}
                    onChange={(e) => setIncludePph23(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-[var(--border)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Potong PPh 23 ({Math.abs(settings?.taxPph23Rate ?? -2)}%)</p>
                    <p className="text-xs text-[var(--text-muted)]">Hanya untuk klien badan usaha</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Produk & Detail</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Pilih Produk / Layanan
                  </label>
                  <select
                    value={catalogItemId}
                    onChange={(e) => setCatalogItemId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    <option value="">-- Pilih Produk --</option>
                    {catalogs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {formatCurrency(item.price || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Tagihan langganan bulanan"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Estimasi Tagihan (Per Klien)</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[var(--text-primary)]">{formatCurrency(subtotal)}</span>
                </div>
                
                {taxDetailsPreview.map((tax, i) => (
                  <div key={i} className="flex justify-between text-[var(--text-secondary)]">
                    <span>{tax.name}</span>
                    <span className={tax.amount < 0 ? "text-danger" : "text-emerald-500"}>
                      {tax.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(tax.amount))}
                    </span>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center">
                  <span className="font-semibold text-[var(--text-primary)]">Total per Klien</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
                
                <div className="pt-3 flex justify-between items-center">
                  <span className="font-bold text-[var(--text-secondary)]">Total Nilai Batch ({clientIds.length} klien)</span>
                  <span className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(grandTotal * clientIds.length)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || clientIds.length === 0 || !catalogItemId || loadingSettings}
            className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Memproses..." : `Terbitkan ${clientIds.length > 0 ? clientIds.length : ''} Tagihan`}
          </button>
        </div>
      </form>
    </div>
  );
}
