// hooks/useTenant.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TenantRecord = {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  logoUrl?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type UseTenantResult = {
  tenant: TenantRecord | null;
  loading: boolean;
  error: string | null;
  found: boolean;
  refetch: () => Promise<void>;
};

export function useTenant(transiterId: string): UseTenantResult {
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedId = useMemo(() => transiterId?.trim() || "", [transiterId]);

  const loadTenant = async () => {
    if (!normalizedId) {
      setTenant(null);
      setLoading(false);
      setError("Missing transiter ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Try direct document lookup first:
      //    transiters/{transiterId}
      const directRef = doc(db, "transiters", normalizedId);
      const directSnap = await getDoc(directRef);

      if (directSnap.exists()) {
        setTenant({
          id: directSnap.id,
          ...(directSnap.data() as Omit<TenantRecord, "id">),
        });
        setLoading(false);
        return;
      }

      // 2. Fallback: try lookup by slug field
      const slugQuery = query(
        collection(db, "transiters"),
        where("slug", "==", normalizedId),
        limit(1)
      );

      const slugSnap = await getDocs(slugQuery);

      if (!slugSnap.empty) {
        const match = slugSnap.docs[0];
        setTenant({
          id: match.id,
          ...(match.data() as Omit<TenantRecord, "id">),
        });
        setLoading(false);
        return;
      }

      // 3. No match found
      setTenant(null);
      setError("Transiter not found.");
    } catch (err) {
      console.error("Error loading transiter:", err);
      setTenant(null);
      setError("Failed to load transiter data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedId]);

  return {
    tenant,
    loading,
    error,
    found: !!tenant,
    refetch: loadTenant,
  };
}