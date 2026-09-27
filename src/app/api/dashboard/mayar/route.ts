import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { mayarClient } from "@/lib/mayar/client";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const balanceRes = await mayarClient.getBalance();
    return NextResponse.json({
      success: true,
      data: balanceRes.data
    });
  } catch (error: unknown) {
    console.error("[GET /api/dashboard/mayar]", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil saldo dari Mayar" },
      { status: 500 }
    );
  }
}
