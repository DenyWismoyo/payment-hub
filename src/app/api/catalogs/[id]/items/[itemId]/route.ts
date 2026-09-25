import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { CatalogItem } from "@/types";

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const { id: catalogId, itemId } = params;
    if (!catalogId || !itemId) {
      return NextResponse.json({ success: false, message: "ID katalog dan item diperlukan" }, { status: 400 });
    }

    const body = await request.json();
    
    const updateData: Partial<CatalogItem> = {
      updatedAt: new Date().toISOString()
    };
    
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.currency) updateData.currency = body.currency;
    if (body.mayarProductId !== undefined) updateData.mayarProductId = body.mayarProductId;
    if (body.mayarPaymentLink !== undefined) updateData.mayarPaymentLink = body.mayarPaymentLink;
    if (body.billingType) updateData.billingType = body.billingType;
    if (body.taxConfig) updateData.taxConfig = body.taxConfig;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const itemRef = adminDb.collection("catalog_items").doc(itemId);
    
    // Make sure it belongs to the catalog
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists || itemDoc.data()?.catalogId !== catalogId) {
       return NextResponse.json({ success: false, message: "Item tidak ditemukan atau tidak sesuai dengan katalog" }, { status: 404 });
    }

    await itemRef.update(updateData);

    const updatedDoc = await itemRef.get();
    const item = { id: updatedDoc.id, ...updatedDoc.data() } as CatalogItem;

    return NextResponse.json({ success: true, data: item });
  } catch (error: unknown) {
    console.error(`[PUT /api/catalogs/${params?.id}/items/${params?.itemId}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const { id: catalogId, itemId } = params;
    if (!catalogId || !itemId) {
      return NextResponse.json({ success: false, message: "ID katalog dan item diperlukan" }, { status: 400 });
    }

    const itemRef = adminDb.collection("catalog_items").doc(itemId);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists || itemDoc.data()?.catalogId !== catalogId) {
       return NextResponse.json({ success: false, message: "Item tidak ditemukan" }, { status: 404 });
    }

    await itemRef.delete();

    // Decrement catalog itemCount
    const catalogRef = adminDb.collection("catalogs").doc(catalogId);
    const catalogDoc = await catalogRef.get();
    if (catalogDoc.exists) {
      const currentCount = catalogDoc.data()?.itemCount || 0;
      await catalogRef.update({
        itemCount: Math.max(0, currentCount - 1)
      });
    }

    return NextResponse.json({ success: true, message: "Item berhasil dihapus" });
  } catch (error: unknown) {
    console.error(`[DELETE /api/catalogs/${params?.id}/items/${params?.itemId}]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
