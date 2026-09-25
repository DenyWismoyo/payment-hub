import { adminDb } from "../firebase/admin";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "CANCEL" | "LOGIN" | "SETTINGS_UPDATE";

export interface AuditLogPayload {
  adminEmail: string;
  action: AuditAction;
  resource: "BILLING" | "CATALOG" | "CLIENT" | "SETTINGS" | "AUTH";
  resourceId?: string;
  details: string;
  ipAddress?: string;
}

export async function logAdminAction(payload: AuditLogPayload) {
  try {
    const docRef = adminDb.collection("audit_logs").doc();
    await docRef.set({
      ...payload,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
    });
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
    // Kita tidak men-throw error agar aksi utama admin (misal create billing) tidak gagal 
    // hanya karena gagal mencatat log.
  }
}
