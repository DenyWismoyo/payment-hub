import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

interface AuthResult {
  success: true;
  uid: string;
  email: string;
}

interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Verifikasi Firebase Auth token di API route handler.
 * Digunakan bersamaan dengan middleware.ts yang sudah memfilter
 * keberadaan token di Edge Runtime.
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await verifyAuthToken(request);
 *   if (!auth.success) return auth.response;
 *   // auth.uid dan auth.email tersedia
 * }
 * ```
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized: Token tidak ditemukan" },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verifikasi email admin (opsional, karena middleware sudah check)
    const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (
      allowedEmails.length > 0 &&
      !allowedEmails.includes(decodedToken.email || "")
    ) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, message: "Forbidden: Akses tidak diizinkan" },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized: Token tidak valid atau kadaluarsa" },
        { status: 401 }
      ),
    };
  }
}
