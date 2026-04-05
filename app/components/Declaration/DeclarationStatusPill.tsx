// app/components/Declaration/DeclarationStatusPill.tsx
// DECLARATION STATUS PILL
// PURPOSE:
// This component displays declaration workflow status
// as a visual status badge.
//
// WHAT THIS COMPONENT DOES:
// - receives one declaration status
// - applies status-specific color styling
// - keeps workflow visibility clear across pages
//
// USED INSIDE:
// Declaration page
// DeclarationWizard
// Declaration summary cards
//
// IMPORTANT:
// This component should remain lightweight because
// it will be reused in many declaration views.

import React from "react";
import { DeclarationStatus } from "@/types/declarationStatus";

interface DeclarationStatusPillProps {
  status: DeclarationStatus | string;
}

export default function DeclarationStatusPill({
  status,
}: DeclarationStatusPillProps) {
  const s = String(status).toUpperCase();

  const base =
    "inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] border";

  const map: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    VERIFIED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ASSESSED: "bg-green-100 text-green-800 border-green-200",
    SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
    PAID: "bg-violet-100 text-violet-800 border-violet-200",
    RELEASED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span className={`${base} ${map[s] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {s}
    </span>
  );
}