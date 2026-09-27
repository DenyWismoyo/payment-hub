import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { settingsSchema } from "@/lib/validations/settings";
import { logAdminAction } from "@/lib/utils/audit";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const doc = await adminDb.collection("settings").doc("global").get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: {} });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error: unknown) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    // Zod Validation
    const parseResult = settingsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Validasi gagal", 
        errors: parseResult.error.format() 
      }, { status: 400 });
    }

    const validatedData = parseResult.data;
    
    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.email,
    };

    await adminDb.collection("settings").doc("global").set(updateData, { merge: true });

    await logAdminAction({
      adminEmail: auth.email,
      action: "SETTINGS_UPDATE",
      resource: "SETTINGS",
      resourceId: "global",
      details: "Memperbarui konfigurasi sistem (settings)"
    });

    return NextResponse.json({ success: true, data: updateData });
  } catch (error: unknown) {
    console.error("[POST /api/settings]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
