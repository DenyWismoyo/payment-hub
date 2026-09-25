import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Catalog } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection("catalogs").orderBy("createdAt", "desc").get();
    
    const catalogs: Catalog[] = [];
    snapshot.forEach((doc) => {
      catalogs.push({ id: doc.id, ...doc.data() } as Catalog);
    });

    return NextResponse.json({ success: true, data: catalogs });
  } catch (error: any) {
    console.error("[GET /api/catalogs]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.category) {
      return NextResponse.json({ success: false, message: "Name and category are required" }, { status: 400 });
    }

    const newCatalog: Partial<Catalog> = {
      name: body.name,
      description: body.description || "",
      category: body.category,
      icon: body.icon || "📦",
      color: body.color || "from-blue-500 to-indigo-600",
      isActive: true,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("catalogs").add(newCatalog);
    const catalog = { id: docRef.id, ...newCatalog };

    return NextResponse.json({ success: true, data: catalog }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/catalogs]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
