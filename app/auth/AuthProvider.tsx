/**
 * SIMLOG-WEB
 * Version: v2.0.3
 * Date: 2026-03-09
 * Purpose: Auth context + persistence + portal route protection
 */

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("Auth persistence error:", err);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const isPortalRoute = pathname?.startsWith("/portal");
    const isTrackingRoute = pathname?.startsWith("/portal/tracking");

    const isProtected = Boolean(isPortalRoute && !isTrackingRoute);

    if (!user && isProtected) {
      router.push("/auth/login");
      return;
    }
  }, [ready, user, pathname, router]);

  const value = useMemo(() => ({ user, ready }), [user, ready]);

  if (!ready) {
    return <div className="p-10">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);