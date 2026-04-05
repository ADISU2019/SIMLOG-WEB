// app/components/Declaration/ContainersTab.tsx
// DECLARATION CONTAINERS TAB
// PURPOSE:
// This component manages shipment container information
// inside one declaration workflow.
//
// WHAT THIS COMPONENT DOES:
// - shows shipment container structure
// - lists container references
// - supports VIN / unit tracking placeholders
// - respects read-only workflow mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Later this section can connect to real shipment records,
// truck assignments, chassis references, or VIN-linked imports.

import React from "react";

interface ContainersTabProps {
  readOnly?: boolean;
}

export default function ContainersTab({ readOnly = false }: ContainersTabProps) {
  const containers = [
    {
      code: "MSCU-458712-3",
      type: "Container",
      note: "Primary shipment container currently linked.",
      status: "Registered",
    },
    {
      code: "VIN-ET-2026-8842",
      type: "Vehicle Unit",
      note: "Vehicle reference under declaration shipment.",
      status: "Pending Review",
    },
    {
      code: "TRL-99214",
      type: "Trailer Reference",
      note: "Trailer linked to inland movement.",
      status: "Registered",
    },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================
          CONTAINER TAB HEADER
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Containers Section
        </h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Review shipment units, container references, and transport-linked
          identifiers connected to this declaration.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          CONTAINER LIST
         ========================================================= */}
      <div className="grid gap-4">
        {containers.map((item) => (
          <div
            key={item.code}
            className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  {item.type}
                </p>

                <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                  {item.code}
                </h3>

                <p className="mt-2 text-base font-semibold text-slate-600">
                  {item.note}
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-[0.14em] ${
                  item.status === "Registered"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================
          NEXT STEP NOTE
         ========================================================= */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-emerald-900">
          Container editing, VIN assignment, and shipment linking can later be
          connected directly to tracking and logistics modules.
        </p>
      </div>
    </div>
  );
}