import { useState, useEffect } from "react";
import type { Client } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/clients");
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
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
    fetchClients();
  }, []);

  return { clients, loading, error, refetch: fetchClients };
}
