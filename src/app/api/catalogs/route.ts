import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Catalog } from "@/types";
import { catalogSchema } from "@/lib/validations/catalog";
import { logAdminAction } from "@/lib/utils/audit";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const snapshot = await adminDb.collection("catalogs").orderBy("createdAt", "desc").get();
    
    const catalogs: Catalog[] = [];
    snapshot.forEach((doc) => {
      catalogs.push({ id: doc.id, ...doc.data() } as Catalog);
    });

    return NextResponse.json({ success: true, data: catalogs });
  } catch (error: unknown) {
    console.error("[GET /api/catalogs]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    const parseResult = catalogSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Validasi gagal", 
        errors: parseResult.error.format() 
      }, { status: 400 });
    }

    const validatedData = parseResult.data;

    const newCatalog: Partial<Catalog> = {
      name: validatedData.name,
      description: validatedData.description || "",
      category: validatedData.category,
      icon: validatedData.icon,
      color: validatedData.color,
      isActive: true,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("catalogs").add(newCatalog);
    const catalog = { id: docRef.id, ...newCatalog };

    await logAdminAction({
      adminEmail: "admin@sosocreativehub.com",
      action: "CREATE",
      resource: "CATALOG",
      resourceId: docRef.id,
      details: `Menambahkan katalog baru: ${newCatalog.name} (${newCatalog.category})`
    });

    return NextResponse.json({ success: true, data: catalog }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/catalogs]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
