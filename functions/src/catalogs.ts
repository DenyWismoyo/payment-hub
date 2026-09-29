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

app.get("/:id/items", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    const snapshot = await db.collection("catalog_items")
      .where("catalogId", "==", id)
      .get();
      
    const items: unknown[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in memory by createdAt descending to avoid Composite Index error
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: String(error) });
  }
});

app.post("/:id/items", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const catalogId = getString(req.params.id);
    const catalogDoc = await db.collection("catalogs").doc(catalogId).get();
    if (!catalogDoc.exists) { res.status(404).json({ success: false, message: "Katalog tidak ditemukan" }); return; }

    const body = req.body;
    if (!body.name || body.price === undefined) { res.status(400).json({ success: false, message: "Nama dan harga diperlukan" }); return; }

    const newItem: any = {
      catalogId, name: body.name, description: body.description || "",
      price: Number(body.price), currency: body.currency || "IDR",
      mayarProductId: body.mayarProductId || null, mayarPaymentLink: body.mayarPaymentLink || null,
      billingType: body.billingType || "one_time", taxConfig: body.taxConfig || { isEnabled: false, allocations: [] },
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("catalog_items").add(newItem);
    await db.collection("catalogs").doc(catalogId).update({ itemCount: (catalogDoc.data()?.itemCount || 0) + 1 });
    res.status(201).json({ success: true, data: { id: docRef.id, ...newItem } });
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

export const catalogsApi = onRequest({ invoker: "public", region: "us-central1" }, app);
