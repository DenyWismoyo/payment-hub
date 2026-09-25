"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Client, ClientType } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/lib/validations/client";
import { z } from "zod";

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null; // If null, create mode. If provided, edit mode.
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      type: "private",
      organization: "",
      npwp: "",
      address: "",
    }
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        type: client.type || "private",
        organization: client.organization || "",
        npwp: client.npwp || "",
        address: client.address || "",
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        type: "private",
        organization: "",
        npwp: "",
        address: "",
      });
    }
    setError(null);
  }, [client, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<ClientFormData> = async (formData) => {
    setError(null);

    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Gagal menyimpan data klien");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {client ? "Edit Klien" : "Tambah Klien"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-light)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl shrink-0">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Nama Lengkap / PIC <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Contoh: Budi Santoso"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="budi@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Nomor Telepon/WA
              </label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="0812xxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Tipe Klien <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="private">Swasta / Perusahaan</option>
                <option value="government">Pemerintah</option>
                <option value="individual">Individu / Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Instansi / Organisasi
              </label>
              <input
                {...register("organization")}
                type="text"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="PT XYZ"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                NPWP (Opsional)
              </label>
              <input
                {...register("npwp")}
                type="text"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Nomor Pokok Wajib Pajak"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Alamat Lengkap
              </label>
              <textarea
                {...register("address")}
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Alamat domisili atau instansi..."
                rows={3}
              />
            </div>
          </div>
        </form>

        <div className="p-5 flex justify-end gap-3 border-t border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
