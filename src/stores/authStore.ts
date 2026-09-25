"use client";

import { create } from "zustand";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { Admin } from "@/types";

interface AuthState {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => () => void;
  setAdmin: (admin: Admin | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  admin: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const allowedEmails = ["deny.wismoyo@gmail.com", "wismoyo.dev@gmail.com"];
        
        if (!user.email || !allowedEmails.includes(user.email)) {
          // If not in allowed list, forcefully deny
          console.warn("Unauthorized access attempt by:", user.email);
          auth.signOut();
          set({
            user: null,
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // Fetch admin data (optional, since we already hardcoded emails)
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          const adminData = adminDoc.exists() 
            ? { uid: user.uid, ...adminDoc.data() } as Admin
            : { uid: user.uid, email: user.email, name: user.displayName || "Admin", role: "superadmin" } as Admin;
            
          set({
            user,
            admin: adminData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Fallback to basic admin data if firestore fails
          set({
            user,
            admin: { uid: user.uid, email: user.email, name: user.displayName || "Admin", role: "superadmin" } as Admin,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },

  setAdmin: (admin) => set({ admin }),
  reset: () =>
    set({
      user: null,
      admin: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
