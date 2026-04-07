// app/types/declarationStatus.ts

// ========================
// DECLARATION STATUS
// ========================
export const DECLARATION_STATUS = {
  DRAFT: "DRAFT",
  VERIFIED: "VERIFIED",
  ASSESSED: "ASSESSED",
  SUBMITTED: "SUBMITTED",
  PAID: "PAID",
  RELEASED: "RELEASED",
  CANCELLED: "CANCELLED",
} as const;

export type DeclarationStatus =
  (typeof DECLARATION_STATUS)[keyof typeof DECLARATION_STATUS];

// ========================
// SHIPMENT STATUS
// ========================
export const SHIPMENT_STATUS = {
  CREATED: "CREATED",
  DOCUMENTS_UPLOADED: "DOCUMENTS_UPLOADED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  IN_TRANSIT: "IN_TRANSIT",
  CLEARED: "CLEARED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type ShipmentStatus =
  (typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS];