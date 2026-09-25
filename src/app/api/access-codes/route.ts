import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCodeFormat } from "@/lib/utils/access-code";
import { adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import type { Billing, AccessCode } from "@/types";

/**
 * GET /api/access-codes?code=PAY-XXXXXX
 * Validasi kode akses dan kembalikan data tagihan.
 * 
 * Flow:
 * 1. Validasi format kode
 * 2. Cari di collection `access_codes`
 * 3. Cek expired & isUsed
 * 4. Ambil billing terkait
 */
export async function GET(request: NextRequest) {
  // 0. Rate Limiting based on IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown-ip";
  
  const rateLimit = await checkRateLimit({
    identifier: `access-code-limit-${ip}`,
    limit: 10, // Max 10 attempts
    windowMs: 60 * 1000, // Per 1 minute
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { valid: false, message: rateLimit.message },
      { status: 429 }
    );
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { valid: false, message: "Kode akses diperlukan." },
      { status: 400 }
    );
  }

  if (!isValidAccessCodeFormat(code)) {
    return NextResponse.json(
      { valid: false, message: "Format kode akses tidak valid." },
      { status: 400 }
    );
  }

  try {
    // 1. Cari di collection access_codes (primary lookup)
    const codeDoc = await adminDb.collection("access_codes").doc(code).get();

    if (codeDoc.exists) {
      const codeData = codeDoc.data() as AccessCode;

      // Cek apakah kode sudah digunakan (billing sudah lunas)
      if (codeData.isUsed) {
        // Tetap tampilkan tagihan (agar klien bisa lihat bukti bayar)
        // tapi tandai bahwa sudah used
      }

      // Cek apakah kode sudah expired
      if (codeData.expiresAt) {
        const expiryDate = new Date(codeData.expiresAt);
        if (expiryDate < new Date() && !codeData.isUsed) {
          return NextResponse.json(
            { valid: false, message: "Kode akses sudah kadaluarsa. Silakan hubungi admin." },
            { status: 410 }
          );
        }
      }

      // Ambil billing terkait
      const billingDoc = await adminDb.collection("billings").doc(codeData.billingId).get();
      if (!billingDoc.exists) {
        return NextResponse.json(
          { valid: false, message: "Tagihan terkait tidak ditemukan." },
          { status: 404 }
        );
      }

      const billing = { id: billingDoc.id, ...billingDoc.data() } as Billing;

      return NextResponse.json({
        valid: true,
        message: "Kode akses valid.",
        billing,
      });
    }

    // 2. Fallback: Cari langsung di billings (backward compatibility)
    const billingsRef = adminDb.collection("billings");
    const snapshot = await billingsRef.where("accessCode", "==", code).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { valid: false, message: "Kode akses tidak ditemukan atau sudah tidak berlaku." },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const billing = { id: doc.id, ...doc.data() } as Billing;

    // Cek expired berdasarkan dueDate billing
    if (billing.dueDate && billing.status !== "paid") {
      const dueDate = new Date(billing.dueDate);
      if (dueDate < new Date()) {
        return NextResponse.json({
          valid: true,
          message: "Kode akses valid, tetapi tagihan sudah melewati jatuh tempo.",
          billing,
          warning: "overdue",
        });
      }
    }

    return NextResponse.json({
      valid: true,
      message: "Kode akses valid.",
      billing,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    console.error("[Access Code Validation]", error);
    return NextResponse.json(
      { valid: false, message },
      { status: 500 }
    );
  }
}
