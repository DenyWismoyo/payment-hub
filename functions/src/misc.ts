import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import { db } from "./admin";
import { handleOptions, verifyToken, getString } from "./helpers";

// ─── Payments ─────────────────────────────────────────────────
const pApp = express();
pApp.use(express.json());

pApp.get("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const snapshot = await db.collection("payments").orderBy("createdAt", "desc").limit(50).get();
    const payments: unknown[] = [];
    snapshot.forEach((doc) => payments.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: payments });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const paymentsApi = onRequest({ invoker: "public", region: "us-central1" }, pApp);

// ─── Subscriptions ────────────────────────────────────────────
const sApp = express();
sApp.use(express.json());

sApp.get("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const snapshot = await db.collection("subscriptions").orderBy("createdAt", "desc").get();
    const subs: unknown[] = [];
    snapshot.forEach((doc) => subs.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: subs });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

sApp.post("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const newSub = { ...req.body, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const docRef = await db.collection("subscriptions").add(newSub);
    res.status(201).json({ success: true, data: { id: docRef.id, ...newSub } });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

sApp.put("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("subscriptions").doc(id).update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

sApp.delete("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("subscriptions").doc(id).delete();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const subscriptionsApi = onRequest({ invoker: "public", region: "us-central1" }, sApp);

// ─── Coupons ──────────────────────────────────────────────────
const cApp = express();
cApp.use(express.json());

cApp.get("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const snapshot = await db.collection("coupons").orderBy("createdAt", "desc").get();
    const coupons: unknown[] = [];
    snapshot.forEach((doc) => coupons.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: coupons });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

cApp.post("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const body = req.body;
    const newCoupon = {
      code: body.code?.toUpperCase(), type: body.type, value: body.value,
      maxUses: body.maxUses || null, usedCount: 0, expiresAt: body.expiresAt || null,
      appliesTo: body.appliesTo || "all", status: "active",
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection("coupons").add(newCoupon);
    res.status(201).json({ success: true, data: { id: docRef.id, ...newCoupon } });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

cApp.put("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("coupons").doc(id).update(req.body);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

cApp.delete("/:id", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const id = getString(req.params.id);
    await db.collection("coupons").doc(id).delete();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, message: String(error) }); }
});

export const couponsApi = onRequest({ invoker: "public", region: "us-central1" }, cApp);
