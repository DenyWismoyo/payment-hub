import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { TaxAllocation } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const period = request.nextUrl.searchParams.get("period"); // e.g. "2026-09"
    
    let query: FirebaseFirestore.Query = adminDb.collection("tax_allocations");
    if (period) {
      query = query.where("period", "==", period);
    }
    
    const snapshot = await query.get();
    
    const allocations = snapshot.docs.map(doc => doc.data() as TaxAllocation);
    
    // Group by taxType
    const summary: Record<string, number> = {};
    let totalTax = 0;
    
    allocations.forEach(tax => {
      if (!summary[tax.taxType]) {
        summary[tax.taxType] = 0;
      }
      summary[tax.taxType] += tax.amount;
      totalTax += tax.amount;
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        period: period || "All Time",
        allocations,
        summary,
        totalTax
      } 
    });
  } catch (error: unknown) {
    console.error("[GET /api/tax/report]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
