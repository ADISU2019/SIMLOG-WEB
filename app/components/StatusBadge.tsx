// types/declarationStatus.ts

export type DeclarationStatus =
  | "DRAFT"
  | "VERIFIED"
  | "ASSESSED"
  | "SUBMITTED"
  | "PAID"
  | "RELEASED"
  | "CANCELLED";

export type ShipmentStatus =
  | "CREATED"
  | "DOCUMENTS_UPLOADED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "IN_TRANSIT"
  | "CLEARED"
  | "REJECTED"
  | "CANCELLED";