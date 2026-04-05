// app/components/Declaration/DocumentsTab.tsx
// DECLARATION DOCUMENTS TAB
// PURPOSE:
// This component manages supporting declaration documents
// inside the declaration workflow.
//
// WHAT THIS COMPONENT DOES:
// - shows declaration document readiness
// - lists required customs support documents
// - indicates upload availability
// - respects read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Real upload logic can be connected later to Firebase Storage.
// For now this acts as the declaration document review layer.

import React from "react";

interface DocumentsTabProps {
  readOnly?: boolean;
}

export default function DocumentsTab({ readOnly = false }: DocumentsTabProps) {
  const documents = [
    {
      title: "Commercial Invoice",
      status: "Available",
      note: "Primary customs value document.",
    },
    {
      title: "Packing List",
      status: "Available",
      note: "Shipment content breakdown.",
    },
    {
      title: "Bill of Lading",
      status: "Pending",
      note: "Transport ownership confirmation.",
    },
    {
      title: "Certificate of Origin",
      status: "Missing",
      note: "Origin-based customs treatment reference.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================
          DOCUMENT TAB HEADER
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Attached Documents Section
        </h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Review the supporting documents currently linked to this declaration.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          DOCUMENT LIST
         ========================================================= */}
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div
            key={doc.title}
            className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {doc.title}
                </h3>

                <p className="mt-2 text-base font-semibold text-slate-600">
                  {doc.note}
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-[0.14em] ${
                  doc.status === "Available"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : doc.status === "Pending"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-slate-200 text-slate-700 border border-slate-300"
                }`}
              >
                {doc.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================
          NEXT STEP NOTE
         ========================================================= */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-blue-900">
          Upload controls can later connect to Firebase Storage while keeping
          declaration-linked document tracking here.
        </p>
      </div>
    </div>
  );
}