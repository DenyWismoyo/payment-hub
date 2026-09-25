import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Catalog } from "@/types";

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
      return NextResponse.json({ success: false, message: "ID katalog diperlukan" }, { status: 400 });
    }

    const doc = await adminDb.collection("catalogs").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Katalog tidak ditemukan" }, { status: 404 });
    }

    const catalog = { id: doc.id, ...doc.data() } as Catalog;

    return NextResponse.json({ success: true, data: catalog });
  } catch (error: unknown) {
    console.error(`[GET /api/catalogs/${params?.id}]`, error);
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
      return NextResponse.json({ success: false, message: "ID katalog diperlukan" }, { status: 400 });
    }

    const body = await request.json();
    
    const updateData: Partial<Catalog> = {
      updatedAt: new Date().toISOString()
    };
    
    // Only update fields that are provided
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.icon) updateData.icon = body.icon;
    if (body.color) updateData.color = body.color;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await adminDb.collection("catalogs").doc(id).update(updateData);

    const updatedDoc = await adminDb.collection("catalogs").doc(id).get();
    const catalog = { id: updatedDoc.id, ...updatedDoc.data() } as Catalog;

    return NextResponse.json({ success: true, data: catalog });
  } catch (error: unknown) {
    console.error(`[PUT /api/catalogs/${params?.id}]`, error);
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
      return NextResponse.json({ success: false, message: "ID katalog diperlukan" }, { status: 400 });
    }

    // Optional: check if catalog has items before deleting
    // We'll add this when we implement items CRUD
    
    await adminDb.collection("catalogs").doc(id).delete();

    return NextResponse.json({ success: true, message: "Katalog berhasil dihapus" });
  } catch (error: unknown) {
    console.error(`[DELETE /api/catalogs/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
