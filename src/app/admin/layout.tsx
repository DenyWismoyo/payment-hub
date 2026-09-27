"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  LayoutDashboard,
  FolderOpen,
  FileText,
  CreditCard,
  Users,
  Calculator,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Activity,
  Repeat,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { signOut } from "@/lib/firebase/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/catalogs", label: "Katalog", icon: FolderOpen },
  { href: "/admin/subscriptions", label: "Langganan", icon: Repeat },
  { href: "/admin/billings", label: "Tagihan", icon: FileText },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/clients", label: "Klien", icon: Users },
  { href: "/admin/tax", label: "Pajak", icon: Calculator },
  { href: "/admin/audit", label: "Audit Log", icon: Activity },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isLoading, isAuthenticated, initialize } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Skip layout for login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // For login page, render without admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-soft">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Mobile Overlay ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-300 ${
          sidebarCollapsed ? "w-[72px]" : "w-64"
        } ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                SOSO Payment
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-primary" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  }`}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--border)] p-3">
          {!sidebarCollapsed && admin && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {admin.displayName?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {admin.displayName}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {admin.role}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-danger/80 hover:bg-danger/10 hover:text-danger transition-all"
            title={sidebarCollapsed ? "Keluar" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)] lg:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              SOSO Payment
            </span>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
