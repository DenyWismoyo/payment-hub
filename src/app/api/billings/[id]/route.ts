import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing } from "@/types";
import { logAdminAction } from "@/lib/utils/audit";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID tagihan diperlukan" }, { status: 400 });
    }

    const doc = await adminDb.collection("billings").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const billing = { id: doc.id, ...doc.data() } as Billing;

    return NextResponse.json({ success: true, data: billing });
  } catch (error: unknown) {
    console.error(`[GET /api/billings/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID tagihan diperlukan" }, { status: 400 });
    }

    const body = await request.json();
    
    const updateData: Partial<Billing> = {
      updatedAt: new Date().toISOString()
    };
    
    // Allow updating status or notes
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const ref = adminDb.collection("billings").doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    await ref.update(updateData);

    const updatedDoc = await ref.get();
    const billing = { id: updatedDoc.id, ...updatedDoc.data() } as Billing;

    await logAdminAction({
      adminEmail: "admin@sosocreativehub.com",
      action: "UPDATE",
      resource: "BILLING",
      resourceId: id,
      details: `Memperbarui tagihan ${billing.billingNumber}: ${Object.keys(body).join(", ")}`
    });

    return NextResponse.json({ success: true, data: billing });
  } catch (error: unknown) {
    console.error(`[PUT /api/billings/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
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
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID tagihan diperlukan" }, { status: 400 });
    }

    const ref = adminDb.collection("billings").doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
       return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    // Soft delete: Mark as cancelled
    // (We also ideally cancel it in Mayar here, but we just mark it local for now)
    await ref.update({
      status: "cancelled",
      updatedAt: new Date().toISOString()
    });

    await logAdminAction({
      adminEmail: "admin@sosocreativehub.com",
      action: "CANCEL",
      resource: "BILLING",
      resourceId: id,
      details: `Membatalkan tagihan ${(doc.data() as Billing).billingNumber}`
    });

    return NextResponse.json({ success: true, message: "Tagihan berhasil dibatalkan" });
  } catch (error: unknown) {
    console.error(`[DELETE /api/billings/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
