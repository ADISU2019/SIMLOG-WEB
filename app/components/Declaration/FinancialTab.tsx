// app/components/Declaration/FinancialTab.tsx
// DECLARATION FINANCIAL TAB
// PURPOSE:
// This component manages declaration financial values
// used for customs assessment.
//
// WHAT THIS COMPONENT DOES:
// - captures invoice value
// - captures currency
// - captures freight
// - captures insurance
// - supports read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Financial values directly influence CIF,
// assessment totals, and customs payable calculations.

import React from "react";
import { DeclarationFinancial } from "@/types/declaration";

interface FinancialTabProps {
  financial: DeclarationFinancial;
  setFinancial: React.Dispatch<React.SetStateAction<DeclarationFinancial>>;
  readOnly?: boolean;
}

export default function FinancialTab({
  financial,
  setFinancial,
  readOnly = false,
}: FinancialTabProps) {
  const f = financial as any;

  return (
    <div className="space-y-6">
      {/* =========================================================
          FINANCIAL SECTION TITLE
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Financial</h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Enter financial values carefully because these numbers feed customs
          assessment and declaration totals.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          FINANCIAL INPUT GRID
         ========================================================= */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Invoice Value
          </label>

          <input
            type="number"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Invoice Value"
            value={f.invoiceValue || ""}
            disabled={readOnly}
            onChange={(e) =>
              setFinancial({
                ...(financial as any),
                invoiceValue: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Currency
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Currency"
            value={f.currency || ""}
            disabled={readOnly}
            onChange={(e) =>
              setFinancial({
                ...(financial as any),
                currency: e.target.value,
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Freight
          </label>

          <input
            type="number"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Freight"
            value={f.freight || ""}
            disabled={readOnly}
            onChange={(e) =>
              setFinancial({
                ...(financial as any),
                freight: Number(e.target.value),
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Insurance
          </label>

          <input
            type="number"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Insurance"
            value={f.insurance || ""}
            disabled={readOnly}
            onChange={(e) =>
              setFinancial({
                ...(financial as any),
                insurance: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* =========================================================
          FINANCIAL NOTE
         ========================================================= */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-emerald-900">
          Invoice, freight, and insurance values together influence CIF and the
          final tax burden during assessment.
        </p>
      </div>
    </div>
  );
}