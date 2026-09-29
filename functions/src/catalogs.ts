import * as functions from "firebase-functions";
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
    const snapshot = await db.collection("catalogs").orderBy("createdAt", "desc").get();
    const catalogs: unknown[] = [];
    snapshot.forEach((doc) => catalogs.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: catalogs });
  } catch (error) {
    res.status(500).json({ success: false, message: String(error) });
  }
});

app.post("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const body = req.body;
    if (!body.name || !body.category) {
      res.status(400).json({ success: false, message: "name dan category wajib diisi" });
      return;
    }
    const newCatalog = {
      name: body.name, description: body.description || "", category: body.category,
      icon: body.icon || "📁", color: body.color || "#6366f1",
      isActive: true, itemCount: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection("catalogs").add(newCatalog);
    res.status(201).json({ success: true, data: { id: docRef.id, ...newCatalog } });
  } catch (error) {
    res.status(500).json({ success: false, message: String(error) });
  }
});

app.get("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    const doc = await db.collection("catalogs").doc(id).get();
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
    await db.collection("catalogs").doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

app.delete("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("catalogs").doc(id).delete();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const catalogsApi = functions.https.onRequest(app);
