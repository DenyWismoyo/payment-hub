import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { AuditLogPayload } from "@/lib/utils/audit";

export interface AuditLogDocument extends AuditLogPayload {
  id: string;
  timestamp: string;
  timestampMs: number;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");

    let query: FirebaseFirestore.Query = adminDb.collection("audit_logs");

    if (action && action !== "all") {
      query = query.where("action", "==", action);
    }
    if (resource && resource !== "all") {
      query = query.where("resource", "==", resource);
    }

    // Default order is newest first
    query = query.orderBy("timestampMs", "desc").limit(limit);

    const snapshot = await query.get();
    
    const logs: AuditLogDocument[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as AuditLogDocument);
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    console.error("[GET /api/audit]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
