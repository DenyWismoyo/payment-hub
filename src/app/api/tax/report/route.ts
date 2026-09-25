import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const billingsRef = adminDb.collection("billings");
    const snapshot = await billingsRef.where("status", "==", "paid").get();
    
    let totalTaxCollected = 0;
    const taxBreakdown: Record<string, number> = {};
    const taxHistory: import("@/types").TaxHistoryItem[] = [];

    snapshot.forEach((doc) => {
      const b = doc.data() as Billing;
      
      if (b.taxDetails && Array.isArray(b.taxDetails)) {
        b.taxDetails.forEach(tax => {
          if (!taxBreakdown[tax.name]) {
            taxBreakdown[tax.name] = 0;
          }
          taxBreakdown[tax.name] += tax.amount;
          totalTaxCollected += tax.amount;

          taxHistory.push({
            id: doc.id,
            billingNumber: b.billingNumber,
            clientName: b.clientName,
            taxName: tax.name,
            amount: tax.amount,
            date: b.updatedAt || b.createdAt
          });
        });
      }
    });

    // Format breakdown into array
    const breakdownArray = Object.keys(taxBreakdown).map(key => ({
      name: key,
      amount: taxBreakdown[key]
    })).sort((a, b) => b.amount - a.amount);

    taxHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        totalTaxCollected,
        breakdown: breakdownArray,
        history: taxHistory.slice(0, 50) // Return last 50 for table
      }
    });

  } catch (error: unknown) {
    console.error("[Tax Report API]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
