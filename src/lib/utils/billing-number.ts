import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Generate nomor billing sequential yang unik dan atomic.
 * Format: INV-{YEAR}-{SEQUENTIAL_4DIGIT}
 * Contoh: INV-2026-0001, INV-2026-0002, ...
 *
 * Menggunakan Firestore transaction untuk memastikan atomicity.
 */
export async function generateBillingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterId = `billing_counter_${year}`;
  const counterRef = adminDb.collection("settings").doc(counterId);

  const newNumber = await adminDb.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let nextNumber: number;

    if (!counterDoc.exists) {
      nextNumber = 1;
      transaction.set(counterRef, {
        currentNumber: 1,
        year,
        updatedAt: new Date().toISOString(),
      });
    } else {
      nextNumber = (counterDoc.data()?.currentNumber || 0) + 1;
      transaction.update(counterRef, {
        currentNumber: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });
    }

    return nextNumber;
  });

  return `INV-${year}-${String(newNumber).padStart(4, "0")}`;
}
