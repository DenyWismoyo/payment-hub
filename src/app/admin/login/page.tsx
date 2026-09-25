"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login gagal.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col gradient-mesh">
      {/* Top nav */}
      <nav className="flex items-center px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Login</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">SOSO Creative Hub — Payment Center</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-lg text-center">
            
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Gunakan akun Google yang memiliki akses khusus untuk melanjutkan.
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 mb-6 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-slide-down text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-800 border border-gray-200 font-semibold shadow-sm hover:bg-gray-50 hover:shadow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            Akses admin terbatas untuk deny.wismoyo@gmail.com & wismoyo.dev@gmail.com
          </p>
        </div>
      </main>
    </div>
  );
}
