// app/types/declarationStatus.ts
// DECLARATION STATUS TYPES
// PURPOSE:
// This file defines the allowed workflow statuses
// for a declaration inside SIMLOG-WEB.
//
// WHAT THIS FILE DOES:
// - provides a strict status enum
// - keeps declaration workflow transitions consistent
// - supports shared use across pages, hooks, and components
//
// USED BY:
// 1. DeclarationWizard.tsx
// 2. DeclarationStatusPill.tsx
// 3. types/declaration.ts
// 4. declaration page workflow logic
//
// IMPORTANT:
// These statuses represent the official declaration lifecycle.
// If workflow steps change, update this file first.

export enum DeclarationStatus {
  DRAFT = "DRAFT",
  VERIFIED = "VERIFIED",
  ASSESSED = "ASSESSED",
  SUBMITTED = "SUBMITTED",
  PAID = "PAID",
  RELEASED = "RELEASED",
  CANCELLED = "CANCELLED",
}