import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { mayarClient } from "@/lib/mayar/client";
import { generateAccessCode } from "@/lib/utils/access-code";
import { generateBillingNumber } from "@/lib/utils/billing-number";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import type { Billing, Client, CatalogItem } from "@/types";
import { z } from "zod";
import { logAdminAction } from "@/lib/utils/audit";
import { sendBillingEmail } from "@/lib/utils/email";

const batchBillingSchema = z.object({
  clientIds: z.array(z.string().min(1, "Client ID required")),
  catalogItemId: z.string().min(1, "Catalog Item is required"),
  subtotal: z.number().min(0),
  taxDetails: z.array(z.object({
    type: z.enum(["ppn", "pph21", "pph23", "pph4_2", "retribusi", "custom"]),
    name: z.string(),
    percentage: z.number(),
    amount: z.number(),
    isInclusive: z.boolean()
  })),
  taxTotal: z.number().min(0),
  grandTotal: z.number().min(0),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    const parseResult = batchBillingSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Validasi gagal", 
        errors: parseResult.error.format() 
      }, { status: 400 });
    }

    const { clientIds, catalogItemId, taxDetails, subtotal, taxTotal, grandTotal, notes, dueDate } = parseResult.data;

    if (clientIds.length === 0) {
      return NextResponse.json({ success: false, message: "Pilih setidaknya 1 klien." }, { status: 400 });
    }

    // Get catalog item
    const itemDoc = await adminDb.collection("catalog_items").doc(catalogItemId).get();
    if (!itemDoc.exists) {
      return NextResponse.json({ success: false, message: "Catalog item not found" }, { status: 404 });
    }
    const itemData = itemDoc.data() as CatalogItem;

    // Get all clients
    const clientsRef = adminDb.collection("clients");
    
    const results = [];
    const batch = adminDb.batch();

    let successCount = 0;
    
    for (const clientId of clientIds) {
      const clientDoc = await clientsRef.doc(clientId).get();
      if (!clientDoc.exists) continue; // Skip if client not found
      
      const clientData = clientDoc.data() as Client;

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

      try {
        const mayarRes = await mayarClient.createInvoice(mayarPayload);
        
        if (mayarRes.statusCode !== 200 && mayarRes.statusCode !== 201) {
          throw new Error("Failed to create Mayar Invoice");
        }

        // 2. Generate Access Code
        const accessCode = generateAccessCode();
        
        // 3. Prepare Billing record
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
          createdBy: "admin", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const billingRef = adminDb.collection("billings").doc();
        batch.set(billingRef, newBilling);

        const codeRef = adminDb.collection("access_codes").doc(accessCode);
        batch.set(codeRef, {
          code: accessCode,
          billingId: billingRef.id,
          isUsed: false,
          expiresAt: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });

        results.push({ id: billingRef.id, ...newBilling });
        successCount++;

        if (clientData.email) {
          // Send email asynchronously without blocking the loop too much
          sendBillingEmail({
            to: clientData.email,
            subject: `Tagihan Pembayaran - ${billingNumber}`,
            billingNumber,
            clientName: clientData.name,
            accessCode,
            grandTotal,
            paymentUrl: mayarRes.data.link,
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }).catch(console.error); // Catch email errors so it doesn't break batch
        }

      } catch (err) {
        console.error(`Failed generating bill for client ${clientId}`, err);
        // Continue to next client
      }
    }

    if (successCount > 0) {
      await batch.commit();

      await logAdminAction({
        adminEmail: "admin@sosocreativehub.com", // TODO: from token
        action: "CREATE",
        resource: "BILLING",
        details: `Batch tagihan massal untuk ${successCount} klien dengan produk ${itemData.name}`
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil membuat ${successCount} tagihan dari ${clientIds.length} klien terpilih.`,
      data: results 
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/billings/batch]", error);
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
