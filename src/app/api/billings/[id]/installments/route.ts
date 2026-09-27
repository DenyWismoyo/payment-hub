import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing } from "@/types";
import { generateAccessCode } from "@/lib/utils/access-code";

// API untuk memecah 1 tagihan menjadi beberapa cicilan (Partial Payment)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const { terms, splitType } = await request.json(); // terms: number (e.g. 3), splitType: 'equal' | 'custom'
    
    if (!terms || terms < 2) {
      return NextResponse.json({ success: false, message: "Minimum 2 terms required for installment" }, { status: 400 });
    }

    const billingRef = adminDb.collection("billings").doc(id);
    const billingDoc = await billingRef.get();
    
    if (!billingDoc.exists) {
      return NextResponse.json({ success: false, message: "Billing not found" }, { status: 404 });
    }

    const billing = billingDoc.data() as Billing;
    if (billing.status === "paid") {
      return NextResponse.json({ success: false, message: "Cannot split paid billing" }, { status: 400 });
    }

    const amountPerTerm = Math.floor(billing.grandTotal / terms);
    const remainder = billing.grandTotal - (amountPerTerm * terms);
    
    const installments = [];
    
    for (let i = 1; i <= terms; i++) {
      const isLast = i === terms;
      const termAmount = isLast ? amountPerTerm + remainder : amountPerTerm;
      
      const dueDate = new Date(billing.dueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1)); // Tiap bulan
      
      installments.push({
        term: i,
        amount: termAmount,
        dueDate: dueDate.toISOString(),
        status: "pending" as const,
      });
    }

    await billingRef.update({
      status: "partially_paid", // change to partially paid or special status
      installments,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: `Billing split into ${terms} installments successfully`,
      data: installments
    });

  } catch (error: unknown) {
    console.error(`[POST /api/billings/${id}/installments]`, error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
