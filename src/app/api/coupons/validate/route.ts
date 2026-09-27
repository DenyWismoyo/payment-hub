import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const MAYAR_API_KEY = process.env.MAYAR_API_KEY;
const MAYAR_BASE_URL = "https://api.mayar.id";

export async function POST(request: NextRequest) {
  try {
    const { code, amount } = await request.json();

    if (!code || !amount) {
      return NextResponse.json({ success: false, message: "Code and amount are required" }, { status: 400 });
    }

    // Optional: Kita bisa mencatat history penggunaan kupon di DB lokal
    // Untuk validasi, kita gunakan Mayar API
    
    if (!MAYAR_API_KEY) {
      // Mock validation untuk testing lokal tanpa Mayar API
      if (code === "DISC10") {
        const discountAmount = amount * 0.1;
        return NextResponse.json({ 
          success: true, 
          data: { 
            code, 
            discountAmount, 
            finalAmount: amount - discountAmount,
            type: "percentage",
            value: 10
          } 
        });
      }
      return NextResponse.json({ success: false, message: "Invalid coupon code" }, { status: 400 });
    }

    const mayarRes = await fetch(`${MAYAR_BASE_URL}/hl/v2/coupons/validate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAYAR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        amount
      })
    });

    const mayarJson = await mayarRes.json();

    if (!mayarRes.ok) {
      return NextResponse.json({ 
        success: false, 
        message: mayarJson.message || "Invalid coupon code" 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: mayarJson.data });

  } catch (error: unknown) {
    console.error("[POST /api/coupons/validate]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
