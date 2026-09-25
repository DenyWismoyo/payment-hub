"use client";

import { auth } from "@/lib/firebase/config";

/**
 * Fetch wrapper yang secara otomatis menambahkan Firebase Auth token
 * ke header Authorization untuk API calls yang terproteksi.
 * 
 * Gunakan ini sebagai pengganti `fetch()` untuk semua API admin.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("User belum login. Silakan login terlebih dahulu.");
  }

  const token = await user.getIdToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
