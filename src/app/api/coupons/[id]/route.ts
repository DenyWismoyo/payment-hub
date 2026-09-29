import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const data = await request.json();
    const docRef = adminDb.collection("coupons").doc(params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Kupon tidak ditemukan" }, { status: 404 });
    }

    const updates = {
      ...data,
      code: data.code ? data.code.toUpperCase() : doc.data()?.code,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    return NextResponse.json({ success: true, data: { id: params.id, ...doc.data(), ...updates } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    await adminDb.collection("coupons").doc(params.id).delete();
    return NextResponse.json({ success: true, message: "Kupon berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
