import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { CatalogItem, Catalog } from "@/types";
import { mayarClient } from "@/lib/mayar/client";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const catalogId = params.id;
    if (!catalogId) {
      return NextResponse.json({ success: false, message: "ID katalog diperlukan" }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("catalog_items")
      .where("catalogId", "==", catalogId)
      .get();
    
    const items: CatalogItem[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as CatalogItem);
    });

    // Sort in memory by createdAt descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: items });
  } catch (error: unknown) {
    console.error(`[GET /api/catalogs/${params?.id}/items]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const catalogId = params.id;
    if (!catalogId) {
      return NextResponse.json({ success: false, message: "ID katalog diperlukan" }, { status: 400 });
    }

    // Verify catalog exists
    const catalogDoc = await adminDb.collection("catalogs").doc(catalogId).get();
    if (!catalogDoc.exists) {
      return NextResponse.json({ success: false, message: "Katalog tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ success: false, message: "Nama dan harga diperlukan" }, { status: 400 });
    }

    let mayarProductId = body.mayarProductId || null;
    let mayarPaymentLink = body.mayarPaymentLink || null;

    if (!mayarProductId) {
      try {
        const mayarRes = await mayarClient.createPaymentLinkProduct({
          name: body.name,
          amount: Number(body.price),
          description: body.description || `Pembayaran untuk ${body.name}`,
        });
        if (mayarRes.data && mayarRes.data.id) {
          mayarProductId = mayarRes.data.id;
          mayarPaymentLink = mayarRes.data.link || null;
        }
      } catch (error) {
        console.warn(`[POST /api/catalogs/${params?.id}/items] Failed to sync with Mayar:`, error);
        // Continue creating locally even if Mayar fails
      }
    }

    const newItem: Partial<CatalogItem> = {
      catalogId,
      name: body.name,
      description: body.description || "",
      price: Number(body.price),
      currency: body.currency || "IDR",
      mayarProductId,
      mayarPaymentLink,
      billingType: body.billingType || "one_time",
      taxConfig: body.taxConfig || { isEnabled: false, allocations: [] },
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("catalog_items").add(newItem);
    
    // Increment catalog itemCount
    await adminDb.collection("catalogs").doc(catalogId).update({
      itemCount: (catalogDoc.data()?.itemCount || 0) + 1
    });

    const item = { id: docRef.id, ...newItem };

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    console.error(`[POST /api/catalogs/${params?.id}/items]`, error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
