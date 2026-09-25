import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { AuditLogDocument } from "@/app/api/audit/route";

export interface UseAuditLogsOptions {
  limit?: number;
  action?: string;
  resource?: string;
}

export function useAuditLogs(options?: UseAuditLogsOptions) {
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.action) params.append("action", options.action);
      if (options?.resource) params.append("resource", options.resource);

      const url = `/api/audit${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.message);
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [options?.limit, options?.action, options?.resource]);

  return { logs, loading, error, refetch: fetchLogs };
}
