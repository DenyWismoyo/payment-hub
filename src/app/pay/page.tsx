"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  ArrowRight,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { normalizeAccessCode, isValidAccessCodeFormat } from "@/lib/utils/access-code";

export default function PayPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedCode = normalizeAccessCode(code);

    if (!isValidAccessCodeFormat(normalizedCode)) {
      setError("Format kode akses tidak valid. Contoh: PAY-A3X9K2");
      return;
    }

    setIsLoading(true);

    try {
      // Validate access code via API
      const res = await fetch(`/api/access-codes?code=${normalizedCode}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.message || "Kode akses tidak ditemukan atau sudah kadaluarsa.");
        setIsLoading(false);
        return;
      }

      // Redirect to billing detail
      router.push(`/pay/${normalizedCode}`);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-[var(--text-primary)]">SOSO</span>
            <span className="text-lg font-light text-[var(--text-secondary)] ml-1">Payment</span>
          </div>
        </Link>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md animate-scale-in">
          {/* Card */}
          <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-8 shadow-lg">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
              <KeyRound className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-2">
              Masukkan Kode Akses
            </h1>
            <p className="text-[var(--text-secondary)] text-center text-sm mb-8">
              Masukkan kode akses yang Anda terima untuk melihat detail tagihan dan melakukan pembayaran.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="access-code"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                  Kode Akses
                </label>
                <div className="relative">
                  <input
                    id="access-code"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="PAY-XXXXXX"
                    maxLength={10}
                    autoFocus
                    autoComplete="off"
                    className="w-full px-4 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-center text-xl font-mono tracking-[0.2em] placeholder:text-[var(--text-muted)] placeholder:tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-slide-down">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memvalidasi...
                  </>
                ) : (
                  <>
                    Lihat Tagihan
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] text-center">
                Kode akses dikirimkan melalui email atau WhatsApp dari admin
                SOSO Creative Hub. Jika Anda belum menerima kode, silakan hubungi admin.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
