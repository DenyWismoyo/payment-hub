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
    const snapshot = await db.collection("clients").orderBy("createdAt", "desc").get();
    const clients: unknown[] = [];
    snapshot.forEach((doc) => clients.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: clients });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.post("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const body = req.body;
    if (!body.name || !body.email) { res.status(400).json({ success: false, message: "name dan email wajib" }); return; }
    const newClient = {
      name: body.name, email: body.email, phone: body.phone || "",
      type: body.type || "private", organization: body.organization || "",
      npwp: body.npwp || "", address: body.address || "",
      mayarCustomerId: null, totalBillings: 0, totalPaid: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection("clients").add(newClient);
    res.status(201).json({ success: true, data: { id: docRef.id, ...newClient } });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.get("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    const doc = await db.collection("clients").doc(id).get();
    if (!doc.exists) { res.status(404).json({ success: false, message: "Klien tidak ditemukan" }); return; }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.put("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("clients").doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const clientsApi = onRequest({ invoker: "public", region: "us-central1" }, app);
