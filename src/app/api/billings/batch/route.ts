import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { Billing, Client } from "@/types";
import { generateAccessCode } from "@/lib/utils/access-code";

// API ini memungkinkan admin membuat banyak tagihan (batch) untuk banyak klien sekaligus
// Input: array of { clientId, catalogItemId, amount, etc }
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const payload = await request.json();
    
    if (!Array.isArray(payload.billings) || payload.billings.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid payload. 'billings' array required." }, { status: 400 });
    }

    if (payload.billings.length > 50) {
      return NextResponse.json({ success: false, message: "Max batch size is 50 to prevent timeout." }, { status: 400 });
    }

    const batch = adminDb.batch();
    const createdBillings: any[] = [];
    let successCount = 0;

    // We fetch Mayar API sequentially here for simplicity,
    // in production with high volume, consider background processing (Pub/Sub)
    const MAYAR_API_KEY = process.env.MAYAR_API_KEY;
    const MAYAR_BASE_URL = "https://api.mayar.id";

    for (const item of payload.billings) {
      // 1. Fetch Client
      const clientDoc = await adminDb.collection("clients").doc(item.clientId).get();
      if (!clientDoc.exists) continue;
      const client = clientDoc.data() as Client;

      // 2. Fetch Catalog Item
      const catalogDoc = await adminDb.collection("catalog_items").doc(item.catalogItemId).get();
      if (!catalogDoc.exists) continue;
      const catalogItem = catalogDoc.data() as any;

      const billingNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const accessCode = generateAccessCode();
      const amount = item.amount || catalogItem.price;

      // 3. Create Mayar Invoice
      let mayarData = null;
      if (MAYAR_API_KEY) {
        try {
          const mayarRes = await fetch(`${MAYAR_BASE_URL}/hl/v2/invoice`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MAYAR_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: `Tagihan: ${catalogItem.name} - ${client.name}`,
              amount: amount,
              customer_name: client.name,
              customer_email: client.email,
              customer_phone: client.phone || "",
              description: `Batch billing untuk ${catalogItem.name}`
            })
          });

          if (mayarRes.ok) {
            const mayarJson = await mayarRes.json();
            mayarData = mayarJson.data;
          }
        } catch (e) {
          console.error(`[Batch] Mayar error for ${client.id}`, e);
        }
      }

      if (!mayarData) continue;

      // 4. Create Billing
      const billingRef = adminDb.collection("billings").doc();
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newBilling: Billing = {
        id: billingRef.id,
        billingNumber,
        clientId: client.id,
        catalogItemId: catalogItem.id,
        catalogItemName: catalogItem.name,
        accessCode,
        clientName: client.name,
        clientEmail: client.email,
        clientType: client.type,
        clientOrganization: client.organization || "",
        subtotal: amount,
        taxDetails: [],
        taxTotal: 0,
        grandTotal: amount,
        currency: "IDR",
        mayarInvoiceId: mayarData.id,
        mayarPaymentUrl: mayarData.link,
        mayarStatus: "PENDING",
        paymentMethod: null,
        paymentChannel: null,
        status: "issued",
        issuedAt: new Date().toISOString(),
        dueDate,
        paidAt: null,
        notes: item.notes || "Batch Generated Billing",
        createdBy: auth.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(billingRef, newBilling);

      const codeRef = adminDb.collection("access_codes").doc(accessCode);
      batch.set(codeRef, {
        code: accessCode,
        billingId: billingRef.id,
        isUsed: false,
        expiresAt: dueDate,
        createdAt: new Date().toISOString()
      });

      createdBillings.push(newBilling);
      successCount++;
    }

    if (successCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully created ${successCount} billings`,
      data: createdBillings
    });

  } catch (error: unknown) {
    console.error("[POST /api/billings/batch]", error);
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
