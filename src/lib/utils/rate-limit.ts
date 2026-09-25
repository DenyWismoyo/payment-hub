import { adminDb } from "../firebase/admin";

export interface RateLimitOptions {
  identifier: string;    // e.g., IP address or "access-code-123.45.67.89"
  limit: number;         // Max requests allowed
  windowMs: number;      // Time window in milliseconds
}

export async function checkRateLimit({ identifier, limit, windowMs }: RateLimitOptions): Promise<{ success: boolean; message?: string }> {
  const ref = adminDb.collection("rate_limits").doc(identifier);
  
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref);
      const now = Date.now();

      if (!doc.exists) {
        // First request
        transaction.set(ref, {
          count: 1,
          resetAt: now + windowMs,
        });
        return { success: true };
      }

      const data = doc.data();
      if (!data) return { success: true };

      if (now > data.resetAt) {
        // Window expired, reset
        transaction.set(ref, {
          count: 1,
          resetAt: now + windowMs,
        });
        return { success: true };
      }

      if (data.count >= limit) {
        // Rate limit exceeded
        return { success: false, message: `Terlalu banyak request. Silakan coba lagi nanti.` };
      }

      // Increment count
      transaction.update(ref, {
        count: data.count + 1,
      });
      return { success: true };
    });

    return result;
  } catch (error) {
    console.error("Rate limit transaction failed", error);
    // On failure to check rate limit (e.g., Firestore issue), default to allow 
    // to not block legitimate traffic, or block if strict security is needed.
    return { success: true }; 
  }
}
