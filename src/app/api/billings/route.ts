import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { mayarClient } from "@/lib/mayar/client";
import { generateAccessCode } from "@/lib/utils/access-code";
import { generateBillingNumber } from "@/lib/utils/billing-number";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing, Client, CatalogItem, TaxDetail } from "@/types";
import { billingSchema } from "@/lib/validations/billing";
import { logAdminAction } from "@/lib/utils/audit";
import { sendBillingEmail } from "@/lib/utils/email";

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query: FirebaseFirestore.Query = adminDb.collection("billings");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    
    let billings: Billing[] = [];
    snapshot.forEach((doc) => {
      billings.push({ id: doc.id, ...doc.data() } as Billing);
    });

    if (search) {
      const s = search.toLowerCase();
      billings = billings.filter(b => 
        b.billingNumber?.toLowerCase().includes(s) ||
        b.clientName?.toLowerCase().includes(s) ||
        b.accessCode?.toLowerCase().includes(s)
      );
    }

    const total = billings.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedBillings = billings.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ 
      success: true, 
      data: paginatedBillings,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error: unknown) {
    console.error("[GET /api/billings]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    
    // Validate with Zod
    const parseResult = billingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Validasi gagal", 
        errors: parseResult.error.format() 
      }, { status: 400 });
    }

    const { clientId, catalogItemId, taxDetails, subtotal, taxTotal, grandTotal, notes, dueDate } = parseResult.data;

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
      mobile: clientData.phone || "000000000000",
      description: `Tagihan untuk ${clientData.name} - ${itemData.name} - ${notes || ""}`,
      items: [
        {
          quantity: 1,
          rate: grandTotal,
          description: itemData.name
        }
      ]
    };

    const mayarRes = await mayarClient.createInvoice(mayarPayload);
    
    if (mayarRes.statusCode !== 200 && mayarRes.statusCode !== 201) {
      throw new Error("Failed to create Mayar Invoice");
    }

    // 2. Generate Access Code
    const accessCode = generateAccessCode();

    // 3. Prepare Billing record
    // Generate sequential billing number (atomic, no collision)
    const billingNumber = await generateBillingNumber();

    const newBilling: Partial<Billing> = {
      billingNumber,
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
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      expiresAt: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    });

    await batch.commit();

    await logAdminAction({
      adminEmail: "admin@sosocreativehub.com", // In a real app this should come from auth.decodedToken
      action: "CREATE",
      resource: "BILLING",
      resourceId: billingRef.id,
      details: `Membuat tagihan baru ${billingNumber} untuk ${clientData.name} senilai ${grandTotal}`
    });

    if (clientData.email) {
      await sendBillingEmail({
        to: clientData.email,
        subject: `Tagihan Pembayaran - ${billingNumber}`,
        billingNumber,
        clientName: clientData.name,
        accessCode,
        grandTotal,
        paymentUrl: mayarRes.data.link,
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return NextResponse.json({ success: true, data: { id: billingRef.id, ...newBilling } }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/billings]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
