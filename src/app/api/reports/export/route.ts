import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Billing } from "@/types";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "billings";

  try {
    const billingsRef = adminDb.collection("billings");
    const snapshot = await billingsRef.get();

    let csvHeader = "";
    let csvRows: string[] = [];

    if (type === "billings") {
      csvHeader = "ID Tagihan,Client,Katalog,Status,Subtotal,Total Pajak,Grand Total,Tanggal Terbit,Jatuh Tempo\n";
      snapshot.forEach((doc) => {
        const b = doc.data() as Billing;
        const row = [
          b.billingNumber,
          `"${b.clientName}"`,
          `"${b.catalogItemName}"`,
          b.status,
          b.subtotal,
          b.taxTotal,
          b.grandTotal,
          new Date(b.issuedAt).toISOString().split('T')[0],
          new Date(b.dueDate).toISOString().split('T')[0]
        ].join(",");
        csvRows.push(row);
      });
    } else if (type === "tax") {
      csvHeader = "ID Tagihan,Client,Katalog,Jenis Pajak,Jumlah Pajak,Tanggal Lunas\n";
      snapshot.forEach((doc) => {
        const b = doc.data() as Billing;
        if (b.status === "paid" && b.taxDetails) {
          b.taxDetails.forEach(tax => {
            const row = [
              b.billingNumber,
              `"${b.clientName}"`,
              `"${b.catalogItemName}"`,
              `"${tax.name}"`,
              tax.amount,
              b.updatedAt ? new Date(b.updatedAt).toISOString().split('T')[0] : ""
            ].join(",");
            csvRows.push(row);
          });
        }
      });
    }

    const csvData = csvHeader + csvRows.join("\n");

    const response = new NextResponse(csvData);
    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set("Content-Disposition", `attachment; filename="export_${type}_${new Date().toISOString().split('T')[0]}.csv"`);

    return response;

  } catch (error: any) {
    console.error("[Export API]", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
