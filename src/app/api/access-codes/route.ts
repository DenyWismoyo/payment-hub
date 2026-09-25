import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCodeFormat } from "@/lib/utils/access-code";
import { adminDb } from "@/lib/firebase/admin";
import type { Billing } from "@/types";

/**
 * GET /api/access-codes?code=PAY-XXXXXX
 * Validasi kode akses dan kembalikan data tagihan
 */
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      valid: true,
      message: "Kode akses valid.",
      billing,
    });
  } catch (error: any) {
    console.error("[Access Code Validation]", error);
    return NextResponse.json(
      { valid: false, message: error.message || "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
