// hooks/useCustomers.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CustomerRecord = {
  id: string;
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  tin?: string;
  address?: string;
  status?: "Active" | "Pending" | "On Hold" | string;
  declarations?: number;
  documents?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  transiterId?: string;
};

type UseCustomersResult = {
  customers: CustomerRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type UseCustomerResult = {
  customer: CustomerRecord | null;
  loading: boolean;
  error: string | null;
  found: boolean;
  refetch: () => Promise<void>;
};

/**
 * Load all customers for one transiter.
 *
 * First tries:
 *   transiters/{transiterId}/customers
 *
 * Fallback:
 *   customers where transiterId == transiterId
 */
export function useCustomers(transiterId: string): UseCustomersResult {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedId = useMemo(() => transiterId?.trim() || "", [transiterId]);

  const loadCustomers = async () => {
    if (!normalizedId) {
      setCustomers([]);
      setLoading(false);
      setError("Missing transiter ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Try subcollection:
      // transiters/{transiterId}/customers
      try {
        const subcollectionRef = collection(db, "transiters", normalizedId, "customers");
        const subcollectionQuery = query(subcollectionRef, orderBy("name"), limit(200));
        const subcollectionSnap = await getDocs(subcollectionQuery);

        if (!subcollectionSnap.empty) {
          const data = subcollectionSnap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<CustomerRecord, "id">),
          }));
          setCustomers(data);
          setLoading(false);
          return;
        }
      } catch (subErr) {
        console.warn("Subcollection customer lookup failed, trying fallback:", subErr);
      }

      // 2) Fallback root collection with transiterId
      const rootQuery = query(
        collection(db, "customers"),
        where("transiterId", "==", normalizedId),
        limit(200)
      );

      const rootSnap = await getDocs(rootQuery);

      if (!rootSnap.empty) {
        const data = rootSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<CustomerRecord, "id">),
        }));
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      setCustomers([]);
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedId]);

  return {
    customers,
    loading,
    error,
    refetch: loadCustomers,
  };
}

/**
 * Load one customer for one transiter.
 *
 * First tries:
 *   transiters/{transiterId}/customers/{customerId}
 *
 * Fallback:
 *   customers/{customerId}
 */
export function useCustomer(
  transiterId: string,
  customerId: string
): UseCustomerResult {
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedTransiterId = useMemo(
    () => transiterId?.trim() || "",
    [transiterId]
  );
  const normalizedCustomerId = useMemo(
    () => customerId?.trim() || "",
    [customerId]
  );

  const loadCustomer = async () => {
    if (!normalizedTransiterId || !normalizedCustomerId) {
      setCustomer(null);
      setLoading(false);
      setError("Missing transiter ID or customer ID.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Try nested doc:
      // transiters/{transiterId}/customers/{customerId}
      try {
        const nestedRef = doc(
          db,
          "transiters",
          normalizedTransiterId,
          "customers",
          normalizedCustomerId
        );
        const nestedSnap = await getDoc(nestedRef);

        if (nestedSnap.exists()) {
          setCustomer({
            id: nestedSnap.id,
            ...(nestedSnap.data() as Omit<CustomerRecord, "id">),
          });
          setLoading(false);
          return;
        }
      } catch (nestedErr) {
        console.warn("Nested customer lookup failed, trying fallback:", nestedErr);
      }

      // 2) Fallback root doc:
      // customers/{customerId}
      const rootRef = doc(db, "customers", normalizedCustomerId);
      const rootSnap = await getDoc(rootRef);

      if (rootSnap.exists()) {
        const data = rootSnap.data() as Omit<CustomerRecord, "id">;

        // Optional safety check if transiterId is stored on root doc
        if (data.transiterId && data.transiterId !== normalizedTransiterId) {
          setCustomer(null);
          setError("Customer does not belong to this transiter.");
        } else {
          setCustomer({
            id: rootSnap.id,
            ...data,
          });
        }
      } else {
        setCustomer(null);
        setError("Customer not found.");
      }
    } catch (err) {
      console.error("Error loading customer:", err);
      setCustomer(null);
      setError("Failed to load customer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedTransiterId, normalizedCustomerId]);

  return {
    customer,
    loading,
    error,
    found: !!customer,
    refetch: loadCustomer,
  };
}