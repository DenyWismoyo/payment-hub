"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Catalog } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { catalogSchema } from "@/lib/validations/catalog";
import { z } from "zod";

type CatalogFormData = z.infer<typeof catalogSchema>;

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  catalog?: Catalog | null; // If null, it's create mode. If provided, it's edit mode.
}

export function CatalogModal({ isOpen, onClose, onSuccess, catalog }: CatalogModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      category: "",
      icon: "📦",
      color: "from-blue-500 to-indigo-600",
    }
  });

  const selectedColor = watch("color");

  useEffect(() => {
    if (catalog) {
      reset({
        name: catalog.name,
        description: catalog.description || "",
        category: catalog.category,
        icon: catalog.icon || "📦",
        color: catalog.color || "from-blue-500 to-indigo-600",
      });
    } else {
      reset({
        name: "",
        description: "",
        category: "",
        icon: "📦",
        color: "from-blue-500 to-indigo-600",
      });
    }
    setError(null);
  }, [catalog, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<CatalogFormData> = async (formData) => {
    setError(null);

    try {
      const url = catalog ? `/api/catalogs/${catalog.id}` : "/api/catalogs";
      const method = catalog ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Gagal menyimpan katalog");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    }
  };

  const colors = [
    { label: "Blue to Indigo", value: "from-blue-500 to-indigo-600", class: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { label: "Emerald to Teal", value: "from-emerald-500 to-teal-600", class: "bg-gradient-to-br from-emerald-500 to-teal-600" },
    { label: "Amber to Orange", value: "from-amber-500 to-orange-600", class: "bg-gradient-to-br from-amber-500 to-orange-600" },
    { label: "Violet to Purple", value: "from-violet-500 to-purple-600", class: "bg-gradient-to-br from-violet-500 to-purple-600" },
    { label: "Rose to Pink", value: "from-rose-500 to-pink-600", class: "bg-gradient-to-br from-rose-500 to-pink-600" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {catalog ? "Edit Katalog" : "Tambah Katalog"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-light)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Nama Katalog <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Contoh: Digital Marketing"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <input
              {...register("category")}
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Contoh: Jasa"
            />
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Deskripsi
            </label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Deskripsi singkat tentang katalog ini"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Ikon (Emoji)
              </label>
              <input
                {...register("icon")}
                type="text"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="📦"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Warna Tema
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue("color", c.value, { shouldValidate: true })}
                    className={`w-6 h-6 rounded-full ${c.class} ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--text-primary)]' : ''}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
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
              form="catalog-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
