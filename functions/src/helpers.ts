import { auth } from "./admin";
import { Request, Response } from "express";

export type AuthResult = {
  uid: string;
  email: string;
};

/**
 * Verifikasi Firebase ID token dari Authorization header
 */
export async function verifyToken(req: Request, res: Response): Promise<AuthResult | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized: Token tidak ditemukan" });
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized: Token tidak valid" });
    return null;
  }
}

/**
 * Set CORS headers
 */
export function corsHeaders(res: Response): void {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

/**
 * Handle preflight OPTIONS request — returns true if handled
 */
export function handleOptions(req: Request, res: Response): boolean {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

/**
 * Safely extract a string value from express query params or route params
 */
export function getString(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return fallback;
}
