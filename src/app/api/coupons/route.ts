import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Coupon } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase();
    
    let query: FirebaseFirestore.Query = adminDb.collection("coupons");
    
    // Default order
    query = query.orderBy("createdAt", "desc");
    
    const snapshot = await query.get();
    let coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Client-side search (for simple case)
    if (search) {
      coupons = coupons.filter((c: any) => 
        c.code.toLowerCase().includes(search) || 
        (c.name && c.name.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.code || !data.discountType || !data.discountValue) {
      return NextResponse.json(
        { success: false, message: "Code, discountType, and discountValue are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await adminDb.collection("coupons").where("code", "==", data.code.toUpperCase()).get();
    if (!existing.empty) {
      return NextResponse.json(
        { success: false, message: "Kode kupon sudah digunakan." },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("coupons").doc();
    const newCoupon = {
      code: data.code.toUpperCase(),
      name: data.name || "",
      discountType: data.discountType, // 'percentage' | 'fixed'
      discountValue: data.discountValue,
      maxUsage: data.maxUsage || null,
      currentUsage: 0,
      validFrom: data.validFrom || new Date().toISOString(),
      validUntil: data.validUntil || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(newCoupon);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...newCoupon }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
