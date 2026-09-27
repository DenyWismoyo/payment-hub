import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    
    let query: FirebaseFirestore.Query = adminDb.collection("admin_notifications")
      .orderBy("createdAt", "desc")
      .limit(50);
      
    if (unreadOnly) {
      query = query.where("read", "==", false);
    }
    
    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Hanya bisa dipanggil oleh sistem internal
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, message, type, link } = await request.json();
    
    const ref = adminDb.collection("admin_notifications").doc();
    const newNotif = {
      id: ref.id,
      title,
      message,
      type: type || "info", // info, success, warning, error
      link: link || null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await ref.set(newNotif);
    
    return NextResponse.json({ success: true, data: newNotif }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/notifications]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
