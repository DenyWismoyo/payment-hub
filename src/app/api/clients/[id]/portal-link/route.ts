import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { logAdminAction } from "@/lib/utils/audit";
import { sendPortalEmail } from "@/lib/utils/email";
import { Client } from "@/types";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const auth = await verifyAuthToken(request);
    if (!auth.success || !auth.uid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const docRef = adminDb.collection("clients").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    const clientData = docSnap.data() as Client;
    
    // Generate Portal URL (SOSO local portal, NOT Mayar portal)
    const { signPortalToken } = await import('@/lib/utils/jwt');
    const token = await signPortalToken(id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${appUrl}/portal/${id}?token=${token}`;

    // Send email using Resend
    const emailResult = await sendPortalEmail({
      to: clientData.email,
      clientName: clientData.name,
      portalUrl: portalUrl,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.message || "Gagal mengirim email portal");
    }

    await logAdminAction({
      adminEmail: auth.email,
      action: "UPDATE",
      resource: "CLIENT",
      resourceId: id,
      details: `Mengirim Magic Link Portal ke email ${clientData.email}`
    });

    return NextResponse.json({
      success: true,
      message: "Portal link berhasil dikirim ke email klien",
      data: emailResult.data
    });
  } catch (error: any) {
    console.error("[Client Portal Link Error]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send portal link" },
      { status: 500 }
    );
  }
}
