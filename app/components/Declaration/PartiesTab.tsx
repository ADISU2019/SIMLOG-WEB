// app/components/Declaration/PartiesTab.tsx
// DECLARATION PARTIES TAB
// PURPOSE:
// This component manages the main legal and commercial parties
// linked to one declaration.
//
// WHAT THIS COMPONENT DOES:
// - captures importer information
// - captures exporter information
// - captures declarant information
// - supports read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Party information is a core legal layer of the declaration.
// It should remain clear and stable because customs processing
// depends on the correct identity of all involved parties.

import React from "react";
import { DeclarationParties } from "@/types/declaration";

interface PartiesTabProps {
  parties: DeclarationParties;
  setParties: React.Dispatch<React.SetStateAction<DeclarationParties>>;
  readOnly?: boolean;
}

export default function PartiesTab({
  parties,
  setParties,
  readOnly = false,
}: PartiesTabProps) {
  const p = parties as any;

  return (
    <div className="space-y-6">
      {/* =========================================================
          PARTIES SECTION TITLE
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Parties</h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Record the main business and legal parties connected to this
          declaration before continuing to transport and financial details.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          PARTIES INPUT GRID
         ========================================================= */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Importer
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Importer"
            value={p.importer || ""}
            disabled={readOnly}
            onChange={(e) =>
              setParties({ ...(parties as any), importer: e.target.value })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Exporter
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Exporter"
            value={p.exporter || ""}
            disabled={readOnly}
            onChange={(e) =>
              setParties({ ...(parties as any), exporter: e.target.value })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Declarant
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Declarant"
            value={p.declarant || ""}
            disabled={readOnly}
            onChange={(e) =>
              setParties({ ...(parties as any), declarant: e.target.value })
            }
          />
        </div>
      </div>

      {/* =========================================================
          PARTIES NOTE
         ========================================================= */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-emerald-900">
          Make sure the importer, exporter, and declarant are entered correctly,
          because these identities are central to declaration review and customs
          processing.
        </p>
      </div>
    </div>
  );
}