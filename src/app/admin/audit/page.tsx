"use client";

import { useState } from "react";
import { Activity, Search, Filter, ShieldAlert } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  CANCEL: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOGIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  SETTINGS_UPDATE: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function AuditLogPage() {
  const [action, setAction] = useState("all");
  const [resource, setResource] = useState("all");
  const { logs, loading, error } = useAuditLogs({ limit: 100, action, resource });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Audit Log" 
        description="Pantau riwayat aktivitas dan perubahan data sistem"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
        >
          <option value="all">Semua Aksi</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="CANCEL">CANCEL</option>
          <option value="DELETE">DELETE</option>
          <option value="SETTINGS_UPDATE">SETTINGS</option>
        </select>

        <select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
        >
          <option value="all">Semua Resource</option>
          <option value="BILLING">BILLING</option>
          <option value="CLIENT">CLIENT</option>
          <option value="CATALOG">CATALOG</option>
          <option value="SETTINGS">SETTINGS</option>
          <option value="AUTH">AUTH</option>
        </select>
      </div>

      {/* States */}
      {loading && <LoadingSkeleton type="table" count={8} />}
      {error && <div className="text-center text-red-500 py-10">Error: {error}</div>}
      
      {!loading && !error && logs.length === 0 && (
        <EmptyState 
          icon={ShieldAlert}
          title="Log Kosong"
          description="Belum ada riwayat aktivitas yang tercatat dengan filter saat ini."
        />
      )}

      {/* Audit Log Table */}
      {!loading && !error && logs.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Waktu</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Admin</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Aksi</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Resource</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-6 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {new Date(log.timestamp).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">{log.adminEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-[var(--text-secondary)]">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate max-w-[120px]">
                          ID: {log.resourceId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--text-primary)] max-w-md line-clamp-2">
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
