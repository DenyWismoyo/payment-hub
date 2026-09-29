import * as functions from "firebase-functions";
import express, { Request, Response } from "express";
import { db } from "./admin";
import { handleOptions, verifyToken } from "./helpers";

const app = express();
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const snapshot = await db.collection("billings").get();
    let totalPendapatan = 0, pendapatanBulanIni = 0, pendapatanBulanLalu = 0;
    let tagihanAktif = 0, lunasBulanIni = 0, lunasBulanLalu = 0, jatuhTempo = 0;
    const now = new Date();
    const currentMonth = now.getMonth(), currentYear = now.getFullYear();
    const prevMonth = new Date(currentYear, currentMonth - 1, 1).getMonth();
    const prevYear = new Date(currentYear, currentMonth - 1, 1).getFullYear();
    const recentTransactions: { rawDate: number; [k: string]: unknown }[] = [];
    const catalogBreakdownMap: Record<string, number> = {};
    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
    const revenueMap: Record<string, number> = {};
    const revenueChart: { name: string; _key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      revenueMap[key] = 0;
      revenueChart.push({ name: monthNames[d.getMonth()], _key: key });
    }
    snapshot.forEach((doc) => {
      const b = doc.data();
      const isPaid = b.status === "paid" || b.mayarStatus === "PAID";
      const isOverdue = new Date(b.dueDate) < now && !isPaid && b.status !== "cancelled";
      if (isPaid) {
        totalPendapatan += b.grandTotal;
        const pd = b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt);
        if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) { lunasBulanIni++; pendapatanBulanIni += b.grandTotal; }
        else if (pd.getMonth() === prevMonth && pd.getFullYear() === prevYear) { lunasBulanLalu++; pendapatanBulanLalu += b.grandTotal; }
        const pKey = `${pd.getFullYear()}-${pd.getMonth()}`;
        if (revenueMap[pKey] !== undefined) revenueMap[pKey] += b.grandTotal;
        catalogBreakdownMap[b.catalogItemName] = (catalogBreakdownMap[b.catalogItemName] || 0) + b.grandTotal;
      } else if (b.status !== "cancelled") { tagihanAktif++; }
      if (isOverdue) jatuhTempo++;
      recentTransactions.push({
        id: b.billingNumber, client: b.clientName, amount: b.grandTotal,
        status: isPaid ? "paid" : isOverdue ? "overdue" : "pending",
        date: new Date(b.createdAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" }),
        product: b.catalogItemName, rawDate: new Date(b.createdAt).getTime(),
      });
    });
    const topRecent = recentTransactions.sort((a, b) => b.rawDate - a.rawDate).slice(0, 5);
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? { change: "+100%", trend: "up" } : { change: "0%", trend: "neutral" };
      const diff = ((curr - prev) / prev) * 100;
      return { change: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`, trend: diff > 0 ? "up" : diff < 0 ? "down" : "neutral" };
    };
    const catalogBreakdown = Object.keys(catalogBreakdownMap).map((key, idx) => {
      const colors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-gray-500"];
      const amount = catalogBreakdownMap[key];
      return { name: key, amount, percentage: totalPendapatan > 0 ? Math.round((amount/totalPendapatan)*100) : 0, color: colors[idx % colors.length] };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);
    res.json({
      success: true, cached: false,
      data: {
        stats: [
          { label: "Total Pendapatan", value: totalPendapatan, ...calcTrend(pendapatanBulanIni, pendapatanBulanLalu) },
          { label: "Tagihan Aktif", value: tagihanAktif, change: "", trend: "neutral" },
          { label: "Lunas Bulan Ini", value: lunasBulanIni, ...calcTrend(lunasBulanIni, lunasBulanLalu) },
          { label: "Jatuh Tempo", value: jatuhTempo, change: "", trend: "neutral" },
        ],
        recentTransactions: topRecent,
        catalogBreakdown,
        revenueChart: revenueChart.map((item) => ({ name: item.name, total: revenueMap[item._key] })),
      },
    });
  } catch (error) { console.error("[dashboard GET]", error); res.status(500).json({ success: false, message: String(error) }); }
});

export const dashboardApi = functions.https.onRequest(app);
