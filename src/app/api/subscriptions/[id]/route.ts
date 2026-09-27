import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Subscription } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const data = await request.json();
    const subRef = adminDb.collection("subscriptions").doc(id);
    const doc = await subRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Subscription not found" }, { status: 404 });
    }
    
    const updateData: Partial<Subscription> = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    // Remove id from update if present
    delete (updateData as any).id;
    
    await subRef.update(updateData);
    
    return NextResponse.json({ success: true, data: { id, ...updateData } });
  } catch (error: unknown) {
    console.error(`[PUT /api/subscriptions/${id}]`, error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    await adminDb.collection("subscriptions").doc(id).delete();
    return NextResponse.json({ success: true, message: "Subscription deleted" });
  } catch (error: unknown) {
    console.error(`[DELETE /api/subscriptions/${id}]`, error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
