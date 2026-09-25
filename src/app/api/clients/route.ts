import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Client } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection("clients").orderBy("createdAt", "desc").get();
    
    const clients: Client[] = [];
    snapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as Client);
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    console.error("[GET /api/clients]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.email || !body.type) {
      return NextResponse.json({ success: false, message: "Name, email, and type are required" }, { status: 400 });
    }

    const newClient: Partial<Client> = {
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      type: body.type, // 'government' | 'private' | 'individual'
      organization: body.organization || "-",
      npwp: body.npwp || "",
      address: body.address || "",
      mayarCustomerId: null, // Will be filled when synced with Mayar
      totalBillings: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("clients").add(newClient);
    const client = { id: docRef.id, ...newClient };

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/clients]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
