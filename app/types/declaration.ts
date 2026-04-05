// types/declaration.ts
// DECLARATION DOMAIN TYPES
// PURPOSE:
// This file defines the shared TypeScript types used by the
// declaration workflow inside SIMLOG-WEB.
//
// WHAT THIS FILE DOES:
// - defines declaration header structure
// - defines legal party structure
// - defines transport structure
// - defines financial structure
// - defines declaration item structure
// - defines attached document structure
// - defines assessment totals structure
// - defines the full declaration record
//
// USED BY:
// 1. DeclarationWizard.tsx
// 2. HeaderTab.tsx
// 3. PartiesTab.tsx
// 4. TransportTab.tsx
// 5. FinancialTab.tsx
// 6. ItemsTab.tsx
// 7. AssessmentNotice.tsx
// 8. assessmentEngine.ts
//
// IMPORTANT:
// These types should stay aligned with the actual declaration UI.
// If the UI fields change, this file should be updated first or at the same time.

import { DeclarationStatus } from "./declarationStatus";

/**
 * Header information for a declaration
 */
export interface DeclarationHeader {
  declarationNumber?: string;
  officeCode?: string;
  date?: string; // ISO date string
}

/**
 * Parties involved in the declaration
 */
export interface DeclarationParties {
  importer?: string;
  exporter?: string;
  declarant?: string;
}

/**
 * Transport details
 */
export interface DeclarationTransport {
  mode?: string;
  carrier?: string;
  vehicleNumber?: string;
}

/**
 * Financial information
 *
 * NOTE:
 * invoiceValue, freight, and insurance are currently used by the UI.
 * CIF may later be calculated from these values depending on workflow.
 */
export interface DeclarationFinancial {
  invoiceValue?: number;
  currency?: string;
  freight?: number;
  insurance?: number;

  // Optional derived / stored totals
  cifValue?: number;
  totalDuty?: number;
  totalVAT?: number;
  totalExcise?: number;
}

/**
 * Individual item in the declaration
 *
 * NOTE:
 * Some fields are optional for now because the current UI is still evolving.
 * This keeps the types aligned with the current declaration builder.
 */
export interface DeclarationItem {
  id?: string;

  // Core item entry fields currently used in UI
  description?: string;
  quantity?: number;
  unitPrice?: number;

  // Customs and assessment fields
  hsCode?: string;
  originCountry?: string;
  weight?: number;
  cifValue?: number;
  dutyRate?: number;
  vatRate?: number;
  exciseRate?: number;

  // Derived / stored results
  calculatedDuty?: number;
  calculatedVAT?: number;
  calculatedExcise?: number;
  lineTotal?: number;
}

/**
 * Supporting document for a declaration
 */
export interface DeclarationDocument {
  id?: string;
  documentType?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string; // ISO string
}

/**
 * Assessment totals shared across declaration workflow
 */
export interface DeclarationTotals {
  cif: number;
  duty: number;
  vat: number;
  excise: number;
  grandTotal: number;
}

/**
 * Full declaration record
 */
export interface Declaration {
  id?: string;

  header: DeclarationHeader;
  parties: DeclarationParties;
  transport: DeclarationTransport;
  financial: DeclarationFinancial;
  items: DeclarationItem[];

  documents?: DeclarationDocument[];
  totals: DeclarationTotals;

  status: DeclarationStatus;

  // Optional summary fields often shown in dashboards/hooks
  declarationNumber?: string;
  customerId?: string;
  customerName?: string;
  customsOffice?: string;
  regime?: string;
  originCountry?: string;
  currency?: string;
  invoiceValue?: string | number;
  transiterId?: string;

  // Metadata
  createdBy?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp

  procedureCode?: string;
  paymentReference?: string;
}