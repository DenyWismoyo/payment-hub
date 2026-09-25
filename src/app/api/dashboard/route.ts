import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing } from "@/types";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const billingsRef = adminDb.collection("billings");
    const snapshot = await billingsRef.get();
    
    let totalPendapatan = 0;
    let pendapatanBulanIni = 0;
    let pendapatanBulanLalu = 0;
    
    let tagihanAktif = 0;
    
    let lunasBulanIni = 0;
    let lunasBulanLalu = 0;
    
    let jatuhTempo = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    
    const recentTransactions: import("@/types").DashboardRecentTransaction[] = [];
    const catalogBreakdownMap: Record<string, number> = {};

    const revenueMap: Record<string, number> = {};
    const revenueChart: { name: string; total: number; _key?: string }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      revenueMap[key] = 0;
      revenueChart.push({
        name: monthNames[d.getMonth()],
        total: 0,
        _key: key
      });
    }

    snapshot.forEach((doc) => {
      const b = doc.data() as Billing;
      const bId = doc.id;
      
      const isPaid = b.status === "paid" || b.mayarStatus === "PAID";
      const isOverdue = new Date(b.dueDate) < now && !isPaid && b.status !== "cancelled";
      
      // Calculate stats
      if (isPaid) {
        totalPendapatan += b.grandTotal;
        const paidDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        const pMonth = paidDate.getMonth();
        const pYear = paidDate.getFullYear();
        
        if (pMonth === currentMonth && pYear === currentYear) {
          lunasBulanIni++;
          pendapatanBulanIni += b.grandTotal;
        } else if (pMonth === prevMonth && pYear === prevYear) {
          lunasBulanLalu++;
          pendapatanBulanLalu += b.grandTotal;
        }

        const pKey = `${pYear}-${pMonth}`;
        if (revenueMap[pKey] !== undefined) {
          revenueMap[pKey] += b.grandTotal;
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

    // Calculate trends
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? { change: "+100%", trend: "up" } : { change: "0%", trend: "neutral" };
      const diff = ((curr - prev) / prev) * 100;
      return {
        change: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`,
        trend: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
      };
    };

    const revTrend = calcTrend(pendapatanBulanIni, pendapatanBulanLalu);
    const lunasTrend = calcTrend(lunasBulanIni, lunasBulanLalu);

    return NextResponse.json({
      success: true,
      data: {
        stats: [
          {
            label: "Total Pendapatan",
            value: totalPendapatan,
            change: revTrend.change,
            trend: revTrend.trend,
          },
          {
            label: "Tagihan Aktif",
            value: tagihanAktif,
            change: "",
            trend: "neutral",
          },
          {
            label: "Lunas Bulan Ini",
            value: lunasBulanIni,
            change: lunasTrend.change,
            trend: lunasTrend.trend,
          },
          {
            label: "Jatuh Tempo",
            value: jatuhTempo,
            change: "",
            trend: "neutral",
          }
        ],
        recentTransactions: topRecent,
        catalogBreakdown,
        revenueChart: revenueChart.map(item => ({ name: item.name, total: revenueMap[item._key!] }))
      }
    });

  } catch (error: unknown) {
    console.error("[Dashboard API]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
