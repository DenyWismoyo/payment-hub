import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const ref = adminDb.collection("admin_notifications").doc(id);
    await ref.update({ read: true });
    
    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (error: unknown) {
    console.error(`[PUT /api/notifications/${id}/read]`, error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
