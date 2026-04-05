// app/components/Declaration/AssessmentNotice.tsx
// DECLARATION ASSESSMENT NOTICE COMPONENT
// PURPOSE:
// This component displays the financial assessment summary
// for one declaration after calculation is completed.
//
// WHAT THIS COMPONENT DOES:
// - shows CIF value
// - shows customs duty
// - shows VAT
// - shows excise
// - shows final grand total payable
// - acts as the assessment summary block before submission
//
// USED IN:
// 1. DeclarationWizard.tsx
// 2. Declaration workspace page
//
// IMPORTANT:
// This component should remain simple, stable, and readable because
// finance users and customs users rely on this section for final review.

import React from "react";
import type { AssessmentTotals } from "@/lib/assessmentEngine";

interface AssessmentNoticeProps {
  totals?: AssessmentTotals;
}

export default function AssessmentNotice({ totals }: AssessmentNoticeProps) {
  const safeTotals: AssessmentTotals = {
    cif: totals?.cif ?? 0,
    duty: totals?.duty ?? 0,
    vat: totals?.vat ?? 0,
    excise: totals?.excise ?? 0,
    grandTotal: totals?.grandTotal ?? 0,
  };

  return (
    <div className="rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-md">
      {/* =========================================================
          ASSESSMENT HEADER
         ========================================================= */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Assessment Notice
        </h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          This section summarizes the calculated financial obligations currently
          attached to this declaration.
        </p>
      </div>

      {/* =========================================================
          ASSESSMENT TOTALS
         ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
          <span className="font-semibold text-slate-700">CIF</span>
          <span className="font-extrabold text-slate-900">
            {safeTotals.cif.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
          <span className="font-semibold text-slate-700">Duty</span>
          <span className="font-extrabold text-slate-900">
            {safeTotals.duty.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
          <span className="font-semibold text-slate-700">VAT</span>
          <span className="font-extrabold text-slate-900">
            {safeTotals.vat.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
          <span className="font-semibold text-slate-700">Excise</span>
          <span className="font-extrabold text-slate-900">
            {safeTotals.excise.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <span className="text-lg font-extrabold text-emerald-800">
            Grand Total
          </span>

          <span className="text-2xl font-extrabold text-emerald-900">
            {safeTotals.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* =========================================================
          INTERPRETATION NOTE
         ========================================================= */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold leading-relaxed text-slate-600">
          These values represent the current working assessment and should be
          reviewed before declaration submission or payment workflow continues.
        </p>
      </div>
    </div>
  );
}