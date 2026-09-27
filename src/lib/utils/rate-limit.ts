/**
 * In-Memory Rate Limiter
 * 
 * Menggantikan implementasi Firestore sebelumnya untuk menghindari
 * biaya read/write Firestore per setiap request rate limit.
 * 
 * Catatan: In-memory = reset saat server restart. 
 * Untuk production multi-instance, gunakan Redis/Upstash.
 */

export interface RateLimitOptions {
  identifier: string;    // e.g., IP address or "access-code-123.45.67.89"
  limit: number;         // Max requests allowed
  windowMs: number;      // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export async function checkRateLimit({ identifier, limit, windowMs }: RateLimitOptions): Promise<{ success: boolean; message?: string }> {
  startCleanup();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or window expired → reset
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true };
  }

  // Within window but under limit → increment
  if (entry.count < limit) {
    entry.count++;
    return { success: true };
  }

  // Rate limit exceeded
  return {
    success: false,
    message: "Terlalu banyak request. Silakan coba lagi nanti.",
  };
}
