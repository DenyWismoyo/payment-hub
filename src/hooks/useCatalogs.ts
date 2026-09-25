import { useState, useEffect } from "react";
import type { Catalog } from "@/types";

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/catalogs");
      const data = await res.json();
      if (data.success) {
        setCatalogs(data.data);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  return { catalogs, loading, error, refetch: fetchCatalogs };
}
