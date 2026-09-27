import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const snapshot = await adminDb.collection("billing_templates").get();
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ success: true, data: templates });
  } catch (error: unknown) {
    console.error("[GET /api/settings/templates]", error);
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
    
    if (!data.name || !data.items) {
      return NextResponse.json({ success: false, message: "Template name and items are required" }, { status: 400 });
    }

    const ref = adminDb.collection("billing_templates").doc();
    const newTemplate = {
      id: ref.id,
      name: data.name,
      description: data.description || "",
      items: data.items, // Array of catalogItemIds or custom line items
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ref.set(newTemplate);
    
    return NextResponse.json({ success: true, data: newTemplate }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/settings/templates]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
