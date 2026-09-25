import { NextRequest, NextResponse } from "next/server";

/**
 * Daftar path API yang TIDAK memerlukan autentikasi:
 * - Webhooks (validasi via signature sendiri)
 * - Access codes (portal publik)
 */
const PUBLIC_API_PATHS = [
  "/api/webhooks",
  "/api/access-codes",
];

/**
 * Middleware untuk memproteksi API routes.
 * 
 * CATATAN: Next.js middleware berjalan di Edge Runtime yang TIDAK mendukung
 * firebase-admin SDK. Maka validasi di sini hanya memastikan keberadaan token.
 * Verifikasi token yang sebenarnya dilakukan di masing-masing API route handler
 * menggunakan helper `verifyAuthToken()`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public API paths
  if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Cek keberadaan Bearer token
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Token tidak ditemukan" },
      { status: 401 }
    );
  }

  // Token ada, lanjutkan ke handler (verifikasi detail di route handler)
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
