"use client";

import { Settings, Save, Shield, Bell, CreditCard, Building } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengaturan</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Konfigurasi sistem, integrasi, dan preferensi aplikasi</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
          <Save className="w-4 h-4" />
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium text-sm transition-all text-left">
            <Building className="w-4 h-4" /> Profil Bisnis
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] font-medium text-sm transition-all text-left">
            <CreditCard className="w-4 h-4" /> Integrasi Mayar
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] font-medium text-sm transition-all text-left">
            <Shield className="w-4 h-4" /> Keamanan
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] font-medium text-sm transition-all text-left">
            <Bell className="w-4 h-4" /> Notifikasi
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Profil Bisnis
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Nama Perusahaan</label>
                  <input type="text" defaultValue="SOSO Creative Hub" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Email Kontak</label>
                  <input type="email" defaultValue="admin@sosocreativehub.com" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Alamat Lengkap</label>
                <textarea rows={3} defaultValue="Jl. Diponegoro No. 22, Bandung, Jawa Barat" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">NPWP Perusahaan</label>
                <input type="text" defaultValue="01.234.567.8-901.000" className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
