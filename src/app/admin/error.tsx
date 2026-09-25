"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Terjadi Kesalahan Server</h2>
      <p className="text-[var(--text-secondary)] max-w-md mb-8">
        Maaf, sistem mengalami kendala saat memuat halaman ini. Silakan coba muat ulang atau hubungi tim support jika masalah berlanjut.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
        >
          Muat Ulang (Hard)
        </button>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Coba Lagi (Soft)
        </button>
      </div>
    </div>
  );
}
