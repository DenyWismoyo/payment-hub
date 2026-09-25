import { useState, useEffect } from "react";
import type { Billing } from "@/types";

export function useBillings() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billings");
      const data = await res.json();
      if (data.success) {
        setBillings(data.data);
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
    fetchBillings();
  }, []);

  return { billings, loading, error, refetch: fetchBillings };
}
