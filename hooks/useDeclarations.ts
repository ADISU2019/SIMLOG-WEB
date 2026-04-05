// hooks/useDeclarations.ts
// DECLARATION DATA HOOKS
// PURPOSE:
// This file provides reusable React hooks for loading declaration data
// from Firestore for one transiter workspace.
//
// WHAT THIS FILE DOES:
// - loads all declarations for one transiter
// - loads one declaration by declaration ID
// - supports nested transiter declarations collection first
// - falls back to root declarations collection if needed
//
// USED BY:
// 1. Declaration workspace list page
// 2. Declaration workspace home page
//
// IMPORTANT:
// This file supports both:
// - transiters/{transiterId}/declarations
// - declarations
//
// That helps during migration while old and new data structures may coexist.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DeclarationRecord = {
  id: string;
  declarationNumber?: string;
  customerId?: string;
  customerName?: string;
  status?: string;
  customsOffice?: string;
  regime?: string;
  originCountry?: string;
  currency?: string;
  invoiceValue?: string | number;
  transiterId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  totals?: {
    cif: number;
    duty: number;
    vat: number;
    excise: number;
    grandTotal: number;
  };
};

type UseDeclarationsResult = {
  declarations: DeclarationRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type UseDeclarationResult = {
  declaration: DeclarationRecord | null;
  loading: boolean;
  error: string | null;
  found: boolean;
  refetch: () => Promise<void>;
};

/**
 * Load all declarations for one transiter.
 *
 * First tries:
 *   transiters/{transiterId}/declarations
 *
 * Fallback:
 *   declarations where transiterId == transiterId
 */
export function useDeclarations(transiterId: string): UseDeclarationsResult {
  const [declarations, setDeclarations] = useState<DeclarationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedId = useMemo(() => transiterId?.trim() || "", [transiterId]);

  const loadDeclarations = async () => {
    if (!normalizedId) {
      setDeclarations([]);
      setLoading(false);
      setError("Missing transiter ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Try nested collection first
      try {
        const nestedRef = collection(
          db,
          "transiters",
          normalizedId,
          "declarations"
        );
        const nestedQuery = query(
          nestedRef,
          orderBy("updatedAt", "desc"),
          limit(200)
        );
        const nestedSnap = await getDocs(nestedQuery);

        if (!nestedSnap.empty) {
          const data = nestedSnap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<DeclarationRecord, "id">),
          }));
          setDeclarations(data);
          setLoading(false);
          return;
        }
      } catch (nestedErr) {
        console.warn(
          "Nested declarations lookup failed, trying fallback:",
          nestedErr
        );
      }

      // 2) Fallback root collection
      const rootQuery = query(
        collection(db, "declarations"),
        where("transiterId", "==", normalizedId),
        limit(200)
      );

      const rootSnap = await getDocs(rootQuery);

      if (!rootSnap.empty) {
        const data = rootSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<DeclarationRecord, "id">),
        }));
        setDeclarations(data);
      } else {
        setDeclarations([]);
      }
    } catch (err) {
      console.error("Error loading declarations:", err);
      setDeclarations([]);
      setError("Failed to load declarations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeclarations();
  }, [normalizedId]);

  return {
    declarations,
    loading,
    error,
    refetch: loadDeclarations,
  };
}

/**
 * Load one declaration for one transiter.
 *
 * First tries:
 *   transiters/{transiterId}/declarations/{declarationId}
 *
 * Fallback:
 *   declarations/{declarationId}
 */
export function useDeclaration(
  transiterId: string,
  declarationId: string
): UseDeclarationResult {
  const [declaration, setDeclaration] = useState<DeclarationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedTransiterId = useMemo(
    () => transiterId?.trim() || "",
    [transiterId]
  );
  const normalizedDeclarationId = useMemo(
    () => declarationId?.trim() || "",
    [declarationId]
  );

  const loadDeclaration = async () => {
    if (!normalizedTransiterId || !normalizedDeclarationId) {
      setDeclaration(null);
      setLoading(false);
      setError("Missing transiter ID or declaration ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Try nested document first
      try {
        const nestedRef = doc(
          db,
          "transiters",
          normalizedTransiterId,
          "declarations",
          normalizedDeclarationId
        );
        const nestedSnap = await getDoc(nestedRef);

        if (nestedSnap.exists()) {
          setDeclaration({
            id: nestedSnap.id,
            ...(nestedSnap.data() as Omit<DeclarationRecord, "id">),
          });
          setLoading(false);
          return;
        }
      } catch (nestedErr) {
        console.warn(
          "Nested declaration lookup failed, trying fallback:",
          nestedErr
        );
      }

      // 2) Fallback root document
      const rootRef = doc(db, "declarations", normalizedDeclarationId);
      const rootSnap = await getDoc(rootRef);

      if (rootSnap.exists()) {
        const data = rootSnap.data() as Omit<DeclarationRecord, "id">;

        if (data.transiterId && data.transiterId !== normalizedTransiterId) {
          setDeclaration(null);
          setError("Declaration does not belong to this transiter.");
        } else {
          setDeclaration({
            id: rootSnap.id,
            ...data,
          });
        }
      } else {
        setDeclaration(null);
        setError("Declaration not found.");
      }
    } catch (err) {
      console.error("Error loading declaration:", err);
      setDeclaration(null);
      setError("Failed to load declaration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeclaration();
  }, [normalizedTransiterId, normalizedDeclarationId]);

  return {
    declaration,
    loading,
    error,
    found: !!declaration,
    refetch: loadDeclaration,
  };
}