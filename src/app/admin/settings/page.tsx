"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Shield, Bell, CreditCard, Building, Calculator } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsData } from "@/lib/validations/settings";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { z } from "zod";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { settings, isLoading, updateSettings } = useSettings();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      companyName: "",
      contactEmail: "",
      address: "",
      npwp: "",
      mayarApiKey: "",
      mayarWebhookSecret: "",
      mayarSandboxMode: false,
      taxPpnRate: 12,
      taxPph23Rate: -2,
      taxEnableDefault: true,
    }
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit: SubmitHandler<SettingsData> = async (data) => {
    try {
      await updateSettings(data);
      toast.success("Pengaturan berhasil disimpan");
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || "Gagal menyimpan pengaturan");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Pengaturan" description="Memuat konfigurasi..." />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader 
        title="Pengaturan" 
        description="Konfigurasi sistem, integrasi, dan preferensi aplikasi"
        action={
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${activeTab === "profile" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
          >
            <Building className="w-4 h-4" /> Profil Bisnis
          </button>
          <button 
            onClick={() => setActiveTab("mayar")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${activeTab === "mayar" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
          >
            <CreditCard className="w-4 h-4" /> Integrasi Mayar
          </button>
          <button 
            onClick={() => setActiveTab("tax")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${activeTab === "tax" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
          >
            <Calculator className="w-4 h-4" /> Konfigurasi Pajak
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${activeTab === "security" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
          >
            <Shield className="w-4 h-4" /> Keamanan
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${activeTab === "notifications" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
          >
            <Bell className="w-4 h-4" /> Notifikasi
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <div className={activeTab === "profile" ? "block" : "hidden"}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Profil Bisnis
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Nama Perusahaan</label>
                    <input {...register("companyName")} type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                    {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Email Kontak</label>
                    <input {...register("contactEmail")} type="email" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                    {errors.contactEmail && <p className="text-red-500 text-xs">{errors.contactEmail.message}</p>}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Alamat Lengkap</label>
                  <textarea {...register("address")} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">NPWP Perusahaan</label>
                  <input {...register("npwp")} type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === "mayar" ? "block" : "hidden"}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Integrasi Mayar
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">API Key</label>
                  <input {...register("mayarApiKey")} type="password" placeholder="sk_live_..." className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  <p className="text-xs text-[var(--text-muted)]">Pastikan menggunakan key production saat live.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Webhook Secret</label>
                  <input {...register("mayarWebhookSecret")} type="password" placeholder="whsec_..." className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input {...register("mayarSandboxMode")} type="checkbox" id="sandbox" className="rounded text-primary focus:ring-primary" />
                  <label htmlFor="sandbox" className="text-sm text-[var(--text-secondary)]">Aktifkan Sandbox Mode</label>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === "tax" ? "block" : "hidden"}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Konfigurasi Pajak Default
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Tarif PPN (%)</label>
                    <input {...register("taxPpnRate", { valueAsNumber: true })} type="number" step="0.1" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                    {errors.taxPpnRate && <p className="text-red-500 text-xs">{errors.taxPpnRate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Tarif PPh 23 (%)</label>
                    <input {...register("taxPph23Rate", { valueAsNumber: true })} type="number" step="0.1" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                    {errors.taxPph23Rate && <p className="text-red-500 text-xs">{errors.taxPph23Rate.message}</p>}
                    <p className="text-[10px] text-[var(--text-muted)]">Gunakan nilai negatif (contoh: -2) karena sifatnya memotong tagihan.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                  <input {...register("taxEnableDefault")} type="checkbox" id="taxDefault" className="rounded text-primary focus:ring-primary" />
                  <label htmlFor="taxDefault" className="text-sm text-[var(--text-secondary)]">Terapkan otomatis pada setiap tagihan baru</label>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === "security" ? "block" : "hidden"}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in text-[var(--text-secondary)] text-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Keamanan
              </h2>
              <p>Opsi keamanan akun, 2FA, dan whitelist email akan tersedia di update berikutnya.</p>
            </div>
          </div>

          <div className={activeTab === "notifications" ? "block" : "hidden"}>
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm animate-fade-in text-[var(--text-secondary)] text-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifikasi
              </h2>
              <p>Pengaturan email notifikasi tagihan dan invoice akan segera hadir.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
