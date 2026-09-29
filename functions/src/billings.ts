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

app.post("/", async (req: Request, res: Response) => {
  if (handleOptions(req, res)) return;
  const authResult = await verifyToken(req, res);
  if (!authResult) return;
  try {
    const { clientId, catalogItemId, qty, notes, dueDate, subtotal, taxDetails, taxTotal, grandTotal } = req.body;
    if (!clientId || !catalogItemId) {
      res.status(400).json({ success: false, message: "Klien dan item katalog diperlukan" });
      return;
    }

    // Fetch client
    const clientDoc = await db.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) {
      res.status(404).json({ success: false, message: "Klien tidak ditemukan" });
      return;
    }
    const clientData = clientDoc.data();

    // Fetch catalog item
    const itemDoc = await db.collection("catalog_items").doc(catalogItemId).get();
    if (!itemDoc.exists) {
      res.status(404).json({ success: false, message: "Item katalog tidak ditemukan" });
      return;
    }
    const itemData = itemDoc.data();

    // Generate billing number INV/YYYY/MM/XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const countDoc = await db.collection("counters").doc("billings").get();
    const currentCount = countDoc.exists ? countDoc.data()?.count || 0 : 0;
    const nextCount = currentCount + 1;
    await db.collection("counters").doc("billings").set({ count: nextCount }, { merge: true });
    
    const billingNumber = `INV/${year}/${month}/${String(nextCount).padStart(4, "0")}`;
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const billingData = {
      billingNumber,
      clientId,
      catalogItemId,
      catalogItemName: itemData?.name || "Layanan",
      accessCode,
      clientName: clientData?.name || "Klien",
      clientEmail: clientData?.email || "",
      clientType: clientData?.type || "private",
      clientOrganization: clientData?.organization || "",
      qty: qty || 1,
      subtotal: subtotal || 0,
      taxDetails: taxDetails || [],
      taxTotal: taxTotal || 0,
      grandTotal: grandTotal || 0,
      currency: "IDR",
      mayarInvoiceId: null,
      mayarPaymentUrl: null,
      mayarStatus: "PENDING",
      paymentMethod: null,
      paymentChannel: null,
      status: "draft",
      issuedAt: now.toISOString(),
      dueDate: dueDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: null,
      notes: notes || "",
      createdBy: authResult.uid,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const docRef = await db.collection("billings").add(billingData);
    
    // Update client total billings
    await db.collection("clients").doc(clientId).update({
      totalBillings: (clientData?.totalBillings || 0) + 1
    });

    res.status(201).json({ success: true, data: { id: docRef.id, ...billingData } });
  } catch (error) {
    console.error("[billings POST]", error);
    res.status(500).json({ success: false, message: String(error) });
  }
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
