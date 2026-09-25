import Link from "next/link";
import {
  CreditCard,
  FileText,
  Shield,
  Zap,
  ArrowRight,
  Building2,
  Users,
  BarChart3,
  Receipt,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Pembayaran Terintegrasi",
    description:
      "Bayar tagihan layanan SOSO Creative Hub dengan berbagai metode pembayaran — Transfer Bank, QRIS, E-Wallet, dan lainnya.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: FileText,
    title: "Invoice & Bukti Bayar",
    description:
      "Invoice otomatis dan bukti pembayaran digital yang sah untuk kebutuhan administrasi dan pelaporan.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    title: "Aman & Terpercaya",
    description:
      "Transaksi diproses melalui payment gateway Mayar.id yang terlisensi dan aman dengan enkripsi end-to-end.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Alokasi Pajak Otomatis",
    description:
      "Perhitungan PPN, PPh, dan retribusi otomatis dari setiap transaksi. Laporan pajak siap untuk pelaporan.",
    color: "from-amber-500 to-orange-600",
  },
];

const clientTypes = [
  {
    icon: Building2,
    title: "Instansi Pemerintah",
    description: "SKPD, Dinas, Badan, dan instansi pemerintah lainnya",
  },
  {
    icon: Users,
    title: "Perusahaan Swasta",
    description: "PT, CV, dan badan usaha swasta",
  },
  {
    icon: Receipt,
    title: "Perorangan",
    description: "Profesional dan individu",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ───────────────────────────────── */}
      <header className="relative overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />

        {/* Top nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                SOSO
              </span>
              <span className="text-lg font-light text-[var(--text-secondary)] ml-1">
                Payment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/pay"
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Bayar Tagihan
            </Link>
            <Link
              href="/admin/login"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              Admin
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            Payment Gateway Terpusat
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-tight mb-6 animate-slide-up">
            Satu Portal untuk
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Semua Pembayaran
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-slide-up">
            Kelola tagihan, terbitkan invoice, dan terima pembayaran untuk
            seluruh layanan SOSO Creative Hub — dalam satu platform yang
            terintegrasi.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link
              href="/pay"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              Bayar Tagihan
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-hover)] hover:border-[var(--border-light)] transition-all"
            >
              Dashboard Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Features Section ───────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Solusi pembayaran lengkap untuk kebutuhan pemerintah dan swasta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-light)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Client Types ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              Melayani Berbagai Klien
            </h2>
            <p className="text-[var(--text-secondary)]">
              Dari instansi pemerintah hingga perorangan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientTypes.map((type) => (
              <div
                key={type.title}
                className="text-center p-6 rounded-2xl glass hover:bg-[var(--surface-hover)] transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <type.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Punya Kode Akses?
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Masukkan kode akses yang Anda terima untuk melihat detail
                tagihan dan melakukan pembayaran.
              </p>
              <Link
                href="/pay"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                Masukkan Kode Akses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              SOSO Creative Hub — Payment Center
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} SOSO Creative Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
