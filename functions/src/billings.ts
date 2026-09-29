import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import { db } from "./admin";
import { handleOptions, verifyToken, getString } from "./helpers";

const app = express();
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const page = getString(req.query.page, "1");
    const limit = getString(req.query.limit, "10");
    const status = getString(req.query.status, "all");
    const clientId = getString(req.query.clientId);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query: FirebaseFirestore.Query = db.collection("billings").orderBy("createdAt", "desc");
    if (status !== "all") query = query.where("status", "==", status);
    if (clientId) query = query.where("clientId", "==", clientId);

    const countSnap = await query.count().get();
    const total = countSnap.data().count;
    const snapshot = await query.offset((pageNum - 1) * limitNum).limit(limitNum).get();

    const billings: unknown[] = [];
    snapshot.forEach((doc) => billings.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: billings, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) { console.error("[billings GET]", error); res.status(500).json({ success: false, message: String(error) }); }
});

app.get("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    const doc = await db.collection("billings").doc(id).get();
    if (!doc.exists) { res.status(404).json({ success: false, message: "Tidak ditemukan" }); return; }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.put("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("billings").doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.delete("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("billings").doc(id).delete();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const billingsApi = onRequest({ invoker: "public", region: "us-central1" }, app);
