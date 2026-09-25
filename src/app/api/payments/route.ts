import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Payment } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const snapshot = await adminDb
      .collection("payments")
      .orderBy("createdAt", "desc")
      .get();
    
    const payments: Payment[] = [];
    snapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() } as Payment);
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    console.error("[GET /api/payments]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
