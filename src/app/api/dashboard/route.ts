import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Billing } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const billingsRef = adminDb.collection("billings");
    const snapshot = await billingsRef.get();
    
    let totalPendapatan = 0;
    let tagihanAktif = 0;
    let lunasBulanIni = 0;
    let jatuhTempo = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const recentTransactions: any[] = [];
    const catalogBreakdownMap: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const b = doc.data() as Billing;
      const bId = doc.id;
      
      const isPaid = b.status === "paid" || b.mayarStatus === "PAID";
      const isOverdue = new Date(b.dueDate) < now && !isPaid && b.status !== "cancelled";
      
      // Calculate stats
      if (isPaid) {
        totalPendapatan += b.grandTotal;
        const paidDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
          lunasBulanIni++;
        }
      } else if (b.status !== "cancelled") {
        tagihanAktif++;
      }
      
      if (isOverdue) {
        jatuhTempo++;
      }
      
      // Catalog Breakdown (only paid)
      if (isPaid) {
        if (!catalogBreakdownMap[b.catalogItemName]) {
          catalogBreakdownMap[b.catalogItemName] = 0;
        }
        catalogBreakdownMap[b.catalogItemName] += b.grandTotal;
      }
      
      recentTransactions.push({
        id: b.billingNumber,
        client: b.clientName,
        amount: b.grandTotal,
        status: isPaid ? "paid" : isOverdue ? "overdue" : "pending",
        date: new Date(b.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
        product: b.catalogItemName,
        rawDate: new Date(b.createdAt).getTime()
      });
    });

    recentTransactions.sort((a, b) => b.rawDate - a.rawDate);
    const topRecent = recentTransactions.slice(0, 5);

    // Convert catalog breakdown to array and calculate percentage
    const catalogBreakdown = Object.keys(catalogBreakdownMap).map((key, index) => {
      const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-gray-500"];
      const amount = catalogBreakdownMap[key];
      const percentage = totalPendapatan > 0 ? Math.round((amount / totalPendapatan) * 100) : 0;
      return {
        name: key,
        amount,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        stats: [
          {
            label: "Total Pendapatan",
            value: totalPendapatan,
            change: "+12.5%", // Demo value for change
            trend: "up",
          },
          {
            label: "Tagihan Aktif",
            value: tagihanAktif,
            change: "+3",
            trend: "up",
          },
          {
            label: "Lunas Bulan Ini",
            value: lunasBulanIni,
            change: "+8",
            trend: "up",
          },
          {
            label: "Jatuh Tempo",
            value: jatuhTempo,
            change: "+2",
            trend: "down",
          }
        ],
        recentTransactions: topRecent,
        catalogBreakdown
      }
    });

  } catch (error: any) {
    console.error("[Dashboard API]", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
