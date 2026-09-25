import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { mayarClient } from "@/lib/mayar/client";
import { generateAccessCode } from "@/lib/utils/access-code";
import type { Billing, Client, CatalogItem, TaxDetail } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection("billings").orderBy("createdAt", "desc").get();
    
    const billings: Billing[] = [];
    snapshot.forEach((doc) => {
      billings.push({ id: doc.id, ...doc.data() } as Billing);
    });

    return NextResponse.json({ success: true, data: billings });
  } catch (error: any) {
    console.error("[GET /api/billings]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, catalogItemId, taxDetails, subtotal, taxTotal, grandTotal, notes, dueDate } = body;

    // Validate relations
    if (!clientId || !catalogItemId) {
      return NextResponse.json({ success: false, message: "Client ID and Catalog Item ID are required" }, { status: 400 });
    }

    const clientDoc = await adminDb.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json({ success: false, message: "Client not found" }, { status: 404 });
    }
    const clientData = clientDoc.data() as Client;

    const itemDoc = await adminDb.collection("catalog_items").doc(catalogItemId).get();
    if (!itemDoc.exists) {
      return NextResponse.json({ success: false, message: "Catalog item not found" }, { status: 404 });
    }
    const itemData = itemDoc.data() as CatalogItem;

    // 1. Create Mayar Invoice
    const mayarPayload = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      amount: grandTotal,
      description: `Tagihan untuk ${clientData.name} - ${itemData.name} - ${notes || ""}`,
      expiredAt: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const mayarRes = await mayarClient.createInvoice(mayarPayload);
    
    if (mayarRes.statusCode !== 200 && mayarRes.statusCode !== 201) {
      throw new Error("Failed to create Mayar Invoice");
    }

    // 2. Generate Access Code
    const accessCode = generateAccessCode();

    // 3. Prepare Billing record
    const newBilling: Partial<Billing> = {
      billingNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId,
      catalogItemId,
      catalogItemName: itemData.name, 
      accessCode,
      
      clientName: clientData.name,
      clientEmail: clientData.email,
      clientType: clientData.type,
      clientOrganization: clientData.organization,

      subtotal,
      taxDetails: taxDetails || [],
      taxTotal: taxTotal || 0,
      grandTotal,

      mayarInvoiceId: mayarRes.data.id,
      mayarPaymentUrl: mayarRes.data.link,
      mayarStatus: "PENDING",

      status: "issued",

      issuedAt: new Date().toISOString(),
      dueDate: mayarPayload.expiredAt,
      paidAt: null,
      
      notes: notes || "",
      createdBy: "admin", // in real app, from auth token
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save to Firestore
    const batch = adminDb.batch();
    
    // Save billing
    const billingRef = adminDb.collection("billings").doc();
    batch.set(billingRef, newBilling);

    // Save access code mapping
    const codeRef = adminDb.collection("access_codes").doc(accessCode);
    batch.set(codeRef, {
      code: accessCode,
      billingId: billingRef.id,
      isUsed: false,
      expiresAt: mayarPayload.expiredAt,
      createdAt: new Date().toISOString()
    });

    await batch.commit();

    return NextResponse.json({ success: true, data: { id: billingRef.id, ...newBilling } }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/billings]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
