import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Client } from "@/types";
import { clientSchema } from "@/lib/validations/client";
import { logAdminAction } from "@/lib/utils/audit";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const snapshot = await adminDb.collection("clients").orderBy("createdAt", "desc").get();
    
    const clients: Client[] = [];
    snapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as Client);
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error: unknown) {
    console.error("[GET /api/clients]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    // Zod Validation
    const parseResult = clientSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Validasi gagal", 
        errors: parseResult.error.format() 
      }, { status: 400 });
    }

    const validatedData = parseResult.data;

    const newClient: Partial<Client> = {
      name: validatedData.name,
      email: validatedData.email || "",
      phone: validatedData.phone || "",
      type: validatedData.type,
      organization: validatedData.type === "individual" ? "-" : validatedData.name,
      npwp: validatedData.npwp || "",
      address: validatedData.address || "",
      mayarCustomerId: null, // Will be filled when synced with Mayar
      totalBillings: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await adminDb.collection("clients").add(newClient);
    const client = { id: docRef.id, ...newClient };

    await logAdminAction({
      adminEmail: "admin@sosocreativehub.com",
      action: "CREATE",
      resource: "CLIENT",
      resourceId: docRef.id,
      details: `Menambahkan klien baru: ${newClient.name} (${newClient.type})`
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/clients]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
