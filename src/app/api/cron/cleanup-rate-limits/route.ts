import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Asumsi di collection rate_limits kita menyimpan updatedAt
    const snapshot = await adminDb.collection("rate_limits")
      .where("updatedAt", "<", oneDayAgo)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "Tidak ada data rate_limits yang lama", count: 0 });
    }

    const batch = adminDb.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menghapus ${count} dokumen rate_limits kadaluarsa`,
      count 
    });
  } catch (error: unknown) {
    console.error("[CRON /api/cron/cleanup-rate-limits]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
