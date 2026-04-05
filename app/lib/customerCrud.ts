// lib/customerCrud.ts
// CUSTOMER CRUD HELPER
// PURPOSE:
// This file contains the reusable customer data operations for SIMLOG-WEB.
//
// WHAT THIS FILE DOES:
// - creates a new customer under one transiter
// - updates an existing customer record
// - reads one customer record directly if needed
// - provides one shared place for customer save logic
//
// WHY THIS FILE EXISTS:
// Instead of writing Firestore customer save/update logic separately inside
// many pages, this helper keeps the logic reusable, clean, and easier to maintain.
//
// MAIN OPERATIONS IN THIS FILE:
// 1. createCustomerRecord()
// 2. updateCustomerRecord()
// 3. getCustomerRecord()
//
// FIRESTORE PATH USED HERE:
// transiters/{transiterId}/customers/{customerId}
//
// NOTES:
// - this version is designed for your current nested customer structure
// - timestamps use JavaScript Date ISO strings for simplicity
// - later you can switch to Firestore serverTimestamp() if you want

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CustomerStatus = "Active" | "Pending" | "On Hold";

export type CustomerFormInput = {
  name: string;
  companyType?: string;
  tin?: string;
  address?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  status: CustomerStatus;
  internalReference?: string;
  notes?: string;
};

export type CustomerRecord = CustomerFormInput & {
  id: string;
  transiterId: string;
  declarations: number;
  documents: number;
  createdAt: string;
  updatedAt: string;
};

function normalizeText(value: string | undefined): string {
  return (value || "").trim();
}

function generateCustomerId(name: string): string {
  const base = normalizeText(name).toLowerCase();

  if (!base) return `customer-${Date.now()}`;

  const slug = base
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `customer-${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function validateCustomerInput(input: CustomerFormInput) {
  if (normalizeText(input.name).length < 2) {
    throw new Error("Customer name must be at least 2 characters long.");
  }

  if (normalizeText(input.contactPerson).length < 2) {
    throw new Error("Contact person must be at least 2 characters long.");
  }

  if (normalizeText(input.phone).length < 4) {
    throw new Error("Phone number must be at least 4 characters long.");
  }

  const allowedStatuses: CustomerStatus[] = ["Active", "Pending", "On Hold"];
  if (!allowedStatuses.includes(input.status)) {
    throw new Error("Customer status is invalid.");
  }
}

/**
 * CREATE CUSTOMER RECORD
 *
 * Creates a new customer document under:
 * transiters/{transiterId}/customers/{customerId}
 */
export async function createCustomerRecord(
  transiterId: string,
  input: CustomerFormInput,
  customCustomerId?: string
): Promise<CustomerRecord> {
  const cleanTransiterId = normalizeText(transiterId);
  if (!cleanTransiterId) {
    throw new Error("Missing transiter ID.");
  }

  validateCustomerInput(input);

  const customerId = normalizeText(customCustomerId) || generateCustomerId(input.name);
  const timestamp = nowIso();

  const customerRecord: CustomerRecord = {
    id: customerId,
    transiterId: cleanTransiterId,
    name: normalizeText(input.name),
    companyType: normalizeText(input.companyType),
    tin: normalizeText(input.tin),
    address: normalizeText(input.address),
    contactPerson: normalizeText(input.contactPerson),
    phone: normalizeText(input.phone),
    email: normalizeText(input.email),
    status: input.status,
    internalReference: normalizeText(input.internalReference),
    notes: normalizeText(input.notes),
    declarations: 0,
    documents: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const customerRef = doc(
    db,
    "transiters",
    cleanTransiterId,
    "customers",
    customerId
  );

  const existing = await getDoc(customerRef);
  if (existing.exists()) {
    throw new Error("A customer with this ID already exists.");
  }

  await setDoc(customerRef, customerRecord);

  return customerRecord;
}

/**
 * UPDATE CUSTOMER RECORD
 *
 * Updates an existing customer document under:
 * transiters/{transiterId}/customers/{customerId}
 */
export async function updateCustomerRecord(
  transiterId: string,
  customerId: string,
  input: Partial<CustomerFormInput>
): Promise<void> {
  const cleanTransiterId = normalizeText(transiterId);
  const cleanCustomerId = normalizeText(customerId);

  if (!cleanTransiterId) {
    throw new Error("Missing transiter ID.");
  }

  if (!cleanCustomerId) {
    throw new Error("Missing customer ID.");
  }

  const customerRef = doc(
    db,
    "transiters",
    cleanTransiterId,
    "customers",
    cleanCustomerId
  );

  const existing = await getDoc(customerRef);
  if (!existing.exists()) {
    throw new Error("Customer record was not found.");
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: nowIso(),
  };

  if (input.name !== undefined) {
    const value = normalizeText(input.name);
    if (value.length < 2) {
      throw new Error("Customer name must be at least 2 characters long.");
    }
    updatePayload.name = value;
  }

  if (input.companyType !== undefined) {
    updatePayload.companyType = normalizeText(input.companyType);
  }

  if (input.tin !== undefined) {
    updatePayload.tin = normalizeText(input.tin);
  }

  if (input.address !== undefined) {
    updatePayload.address = normalizeText(input.address);
  }

  if (input.contactPerson !== undefined) {
    const value = normalizeText(input.contactPerson);
    if (value.length < 2) {
      throw new Error("Contact person must be at least 2 characters long.");
    }
    updatePayload.contactPerson = value;
  }

  if (input.phone !== undefined) {
    const value = normalizeText(input.phone);
    if (value.length < 4) {
      throw new Error("Phone number must be at least 4 characters long.");
    }
    updatePayload.phone = value;
  }

  if (input.email !== undefined) {
    updatePayload.email = normalizeText(input.email);
  }

  if (input.status !== undefined) {
    const allowedStatuses: CustomerStatus[] = ["Active", "Pending", "On Hold"];
    if (!allowedStatuses.includes(input.status)) {
      throw new Error("Customer status is invalid.");
    }
    updatePayload.status = input.status;
  }

  if (input.internalReference !== undefined) {
    updatePayload.internalReference = normalizeText(input.internalReference);
  }

  if (input.notes !== undefined) {
    updatePayload.notes = normalizeText(input.notes);
  }

  await updateDoc(customerRef, updatePayload);
}

/**
 * GET ONE CUSTOMER RECORD
 *
 * Reads one customer directly from:
 * transiters/{transiterId}/customers/{customerId}
 */
export async function getCustomerRecord(
  transiterId: string,
  customerId: string
): Promise<CustomerRecord | null> {
  const cleanTransiterId = normalizeText(transiterId);
  const cleanCustomerId = normalizeText(customerId);

  if (!cleanTransiterId || !cleanCustomerId) {
    throw new Error("Missing transiter ID or customer ID.");
  }

  const customerRef = doc(
    db,
    "transiters",
    cleanTransiterId,
    "customers",
    cleanCustomerId
  );

  const snap = await getDoc(customerRef);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as CustomerRecord;
}

/**
 * GET CUSTOMER COLLECTION REFERENCE
 *
 * Useful if later you want to add delete/archive/list helpers.
 */
export function getCustomerCollectionRef(transiterId: string) {
  const cleanTransiterId = normalizeText(transiterId);

  if (!cleanTransiterId) {
    throw new Error("Missing transiter ID.");
  }

  return collection(db, "transiters", cleanTransiterId, "customers");
}