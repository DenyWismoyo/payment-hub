"use client";

import { FolderOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCatalogs } from "@/hooks/useCatalogs";

export default function CatalogsPage() {
  const { catalogs, loading, error } = useCatalogs();
  const [search, setSearch] = useState("");

  const filteredCatalogs = catalogs.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Katalog</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola katalog aplikasi dan layanan
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Tambah Katalog
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Cari katalog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* States */}
      {loading && <div className="text-center text-[var(--text-muted)] py-10">Memuat katalog...</div>}
      {error && <div className="text-center text-red-500 py-10">Error: {error}</div>}
      {!loading && !error && filteredCatalogs.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-10">
          Belum ada katalog. Silakan tambahkan katalog baru.
        </div>
      )}

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCatalogs.map((catalog) => (
          <Link
            key={catalog.id}
            href={`/admin/catalogs/${catalog.id}`}
            className="group p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-light)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${catalog.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}
              >
                {catalog.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-primary transition-colors">
                  {catalog.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                  {catalog.description}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {catalog.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    {catalog.itemCount} item
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
