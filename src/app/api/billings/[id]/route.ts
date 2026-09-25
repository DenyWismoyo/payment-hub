import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Billing } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID tagihan diperlukan" }, { status: 400 });
    }

    const doc = await adminDb.collection("billings").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    const billing = { id: doc.id, ...doc.data() } as Billing;

    return NextResponse.json({ success: true, data: billing });
  } catch (error: any) {
    console.error(`[GET /api/billings/${params?.id}]`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
