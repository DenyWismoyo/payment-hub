import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Subscription } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const clientId = request.nextUrl.searchParams.get("clientId");
    
    let query: FirebaseFirestore.Query = adminDb.collection("subscriptions");
    if (clientId) {
      query = query.where("clientId", "==", clientId);
    }
    
    // Default order
    query = query.orderBy("nextBillingDate", "asc");
    
    const snapshot = await query.get();
    const subscriptions = snapshot.docs.map((doc) => doc.data() as Subscription);
    
    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error: unknown) {
    console.error("[GET /api/subscriptions]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const data = await request.json();
    
    const subRef = adminDb.collection("subscriptions").doc();
    
    const newSub: Subscription = {
      id: subRef.id,
      clientId: data.clientId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      catalogItemId: data.catalogItemId,
      catalogItemName: data.catalogItemName,
      amount: data.amount,
      currency: data.currency || "IDR",
      cycle: data.cycle,
      status: data.status || "active",
      nextBillingDate: data.nextBillingDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await subRef.set(newSub);
    
    return NextResponse.json({ success: true, data: newSub }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/subscriptions]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
