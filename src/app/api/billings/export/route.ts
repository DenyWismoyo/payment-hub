import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken, requireAdminRole } from "@/lib/auth/verify-token";
import type { Billing } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  // Cek RBAC
  const roleCheck = requireAdminRole(auth);
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query: FirebaseFirestore.Query = adminDb.collection("billings");
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    
    // Header CSV
    let csv = "Billing Number,Client Name,Client Email,Catalog Item,Status,Subtotal,Tax Total,Grand Total,Due Date,Created At\n";

    snapshot.forEach((doc) => {
      const b = doc.data() as Billing;
      
      // Escape field untuk CSV
      const no = `"${b.billingNumber}"`;
      const clientName = `"${(b.clientName || "").replace(/"/g, '""')}"`;
      const clientEmail = `"${b.clientEmail || ""}"`;
      const item = `"${(b.catalogItemName || "").replace(/"/g, '""')}"`;
      const bStatus = `"${b.status}"`;
      const subtotal = b.subtotal || 0;
      const tax = b.taxTotal || 0;
      const total = b.grandTotal || 0;
      const due = `"${new Date(b.dueDate).toISOString().split("T")[0]}"`;
      const created = `"${new Date(b.createdAt).toISOString().split("T")[0]}"`;

      csv += `${no},${clientName},${clientEmail},${item},${bStatus},${subtotal},${tax},${total},${due},${created}\n`;
    });

    const filename = `export_billings_${new Date().getTime()}.csv`;
    
    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

    return response;
  } catch (error: unknown) {
    console.error("[GET /api/billings/export]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
