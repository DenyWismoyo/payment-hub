import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Client } from "@/types";

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
      return NextResponse.json({ success: false, message: "ID klien diperlukan" }, { status: 400 });
    }

    const doc = await adminDb.collection("clients").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Klien tidak ditemukan" }, { status: 404 });
    }

    const client = { id: doc.id, ...doc.data() } as Client;
    return NextResponse.json({ success: true, data: client });
  } catch (error: unknown) {
    console.error(`[GET /api/clients/${params?.id}]`, error);
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
      return NextResponse.json({ success: false, message: "ID klien diperlukan" }, { status: 400 });
    }

    const body = await request.json();
    
    const updateData: Partial<Client> = {
      updatedAt: new Date().toISOString()
    };
    
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.type) updateData.type = body.type;
    if (body.organization !== undefined) updateData.organization = body.organization;
    if (body.npwp !== undefined) updateData.npwp = body.npwp;
    if (body.address !== undefined) updateData.address = body.address;

    const ref = adminDb.collection("clients").doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Klien tidak ditemukan" }, { status: 404 });
    }

    await ref.update(updateData);

    const updatedDoc = await ref.get();
    const client = { id: updatedDoc.id, ...updatedDoc.data() } as Client;

    return NextResponse.json({ success: true, data: client });
  } catch (error: unknown) {
    console.error(`[PUT /api/clients/${params?.id}]`, error);
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
      return NextResponse.json({ success: false, message: "ID klien diperlukan" }, { status: 400 });
    }

    const ref = adminDb.collection("clients").doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
       return NextResponse.json({ success: false, message: "Klien tidak ditemukan" }, { status: 404 });
    }

    // Check if client has billings
    const billingsSnapshot = await adminDb.collection("billings").where("clientId", "==", id).limit(1).get();
    if (!billingsSnapshot.empty) {
        return NextResponse.json({ 
            success: false, 
            message: "Tidak dapat menghapus klien karena masih memiliki tagihan." 
        }, { status: 400 });
    }

    await ref.delete();

    return NextResponse.json({ success: true, message: "Klien berhasil dihapus" });
  } catch (error: unknown) {
    console.error(`[DELETE /api/clients/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
