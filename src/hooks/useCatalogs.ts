import { useState, useEffect } from "react";
import type { Catalog } from "@/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/catalogs");
      const data = await res.json();
      if (data.success) {
        setCatalogs(data.data);
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
    fetchCatalogs();
  }, []);

  return { catalogs, loading, error, refetch: fetchCatalogs };
}
