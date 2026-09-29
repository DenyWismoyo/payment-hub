import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { logAdminAction } from "@/lib/utils/audit";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.success || !auth.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'billings' | 'payments' | 'tax'
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    if (!type || !['billings', 'payments', 'tax'].includes(type)) {
      return NextResponse.json({ message: "Invalid export type" }, { status: 400 });
    }

    let query = adminDb.collection(type === 'tax' ? 'tax_allocations' : type).orderBy('createdAt', 'desc');

    if (start && end) {
      query = query
        .where('createdAt', '>=', new Date(start))
        .where('createdAt', '<=', new Date(end));
    }

    const snapshot = await query.get();
    
    // Map data fields based on type
    let data = snapshot.docs.map(doc => {
      const docData = doc.data();
      // Format timestamps
      if (docData.createdAt && docData.createdAt.toDate) {
        docData.createdAt = docData.createdAt.toDate().toISOString();
      }
      if (docData.updatedAt && docData.updatedAt.toDate) {
        docData.updatedAt = docData.updatedAt.toDate().toISOString();
      }
      if (docData.dueDate && docData.dueDate.toDate) {
        docData.dueDate = docData.dueDate.toDate().toISOString();
      }
      if (docData.paidAt && docData.paidAt.toDate) {
        docData.paidAt = docData.paidAt.toDate().toISOString();
      }
      return docData;
    });

    const csv = Papa.unparse(data);

    await logAdminAction({
      adminEmail: auth.email,
      action: "UPDATE",
      resource: "BILLING",
      resourceId: "export",
      details: `Exported ${snapshot.docs.length} ${type} records to CSV`
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error("[Export API Error]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to export data" },
      { status: 500 }
    );
  }
}
