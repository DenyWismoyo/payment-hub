import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { Billing, Client } from "@/types";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.success || !auth.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    // Fetch Billing
    const billingDoc = await adminDb.collection("billings").doc(id).get();
    if (!billingDoc.exists) {
      return NextResponse.json({ message: "Billing not found" }, { status: 404 });
    }
    const billing = billingDoc.data() as Billing;

    // Fetch Client
    const clientDoc = await adminDb.collection("clients").doc(billing.clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }
    const client = clientDoc.data() as Client;

    // Format timestamps for React PDF
    if (billing.createdAt && (billing.createdAt as any).toDate) {
      billing.createdAt = (billing.createdAt as any).toDate().toISOString();
    }
    if (billing.dueDate && (billing.dueDate as any).toDate) {
      billing.dueDate = (billing.dueDate as any).toDate().toISOString();
    }

    // Generate PDF Stream
    const pdfStream = await renderToStream(<InvoicePDF billing={billing} client={client} />);

    return new NextResponse(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${billing.billingNumber}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("[Invoice PDF Gen Error]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
