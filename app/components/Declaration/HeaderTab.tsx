// app/components/Declaration/HeaderTab.tsx
// DECLARATION HEADER TAB
// PURPOSE:
// This component manages the declaration identity section.
//
// WHAT THIS COMPONENT DOES:
// - captures declaration number
// - captures customs office code
// - captures declaration date
// - supports read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Header information forms the legal identity of the declaration.
// This section should remain clean and stable because all later
// declaration sections depend on this header.

import React from "react";
import { DeclarationHeader } from "@/types/declaration";

interface HeaderTabProps {
  header: DeclarationHeader;
  setHeader: React.Dispatch<React.SetStateAction<DeclarationHeader>>;
  readOnly?: boolean;
}

export default function HeaderTab({
  header,
  setHeader,
  readOnly = false,
}: HeaderTabProps) {
  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER SECTION TITLE
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Header</h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Define the main declaration identity before continuing to parties,
          transport, and financial sections.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          HEADER INPUT GRID
         ========================================================= */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Declaration Number
          </label>

          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Declaration Number"
            value={header.declarationNumber || ""}
            disabled={readOnly}
            onChange={(e) =>
              setHeader({
                ...header,
                declarationNumber: e.target.value,
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Office Code
          </label>

          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Office Code"
            value={header.officeCode || ""}
            disabled={readOnly}
            onChange={(e) =>
              setHeader({
                ...header,
                officeCode: e.target.value,
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Declaration Date
          </label>

          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            type="date"
            value={header.date || ""}
            disabled={readOnly}
            onChange={(e) =>
              setHeader({
                ...header,
                date: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* =========================================================
          HEADER NOTE
         ========================================================= */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-blue-900">
          Header data should be completed first because it anchors the entire
          declaration workflow.
        </p>
      </div>
    </div>
  );
}