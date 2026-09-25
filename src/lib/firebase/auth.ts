"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
import type { Admin } from "@/types";

const ALLOWED_EMAILS = ["deny.wismoyo@gmail.com", "wismoyo.dev@gmail.com"];

/**
 * Login admin menggunakan Google Sign-In
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const email = result.user.email || "";

  // Cek apakah email termasuk yang diizinkan
  if (!ALLOWED_EMAILS.includes(email)) {
    await firebaseSignOut(auth);
    throw new Error("Akses ditolak. Email tidak memiliki izin admin.");
  }

  // Opsional: Otomatis tambahkan ke collection "admins" jika belum ada
  const adminRef = doc(db, "admins", result.user.uid);
  const adminDoc = await getDoc(adminRef);
  
  if (!adminDoc.exists()) {
    await setDoc(adminRef, {
      email: email,
      name: result.user.displayName,
      role: "admin",
      createdAt: new Date().toISOString()
    });
  }

  return result.user;
}

/**
 * Logout
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get admin data from Firestore
 */
export async function getAdminData(uid: string): Promise<Admin | null> {
  const adminDoc = await getDoc(doc(db, "admins", uid));
  if (!adminDoc.exists()) return null;
  return { uid, ...adminDoc.data() } as Admin;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
