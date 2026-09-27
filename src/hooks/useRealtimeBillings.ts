import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Client side config
import { Billing } from "@/types";

export function useRealtimeBillings(limitCount = 50) {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const billingsRef = collection(db, "billings");
    const q = query(billingsRef, orderBy("createdAt", "desc"), limit(limitCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Billing[];
        setBillings(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  return { billings, loading, error };
}
