// app/components/Declaration/TransportTab.tsx
// DECLARATION TRANSPORT TAB
// PURPOSE:
// This component manages transport information
// linked to one declaration.
//
// WHAT THIS COMPONENT DOES:
// - captures transport mode
// - captures carrier information
// - captures vehicle number
// - supports read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Transport information connects the declaration
// to physical shipment movement and customs routing.

import React from "react";
import { DeclarationTransport } from "@/types/declaration";

interface TransportTabProps {
  transport: DeclarationTransport;
  setTransport: React.Dispatch<React.SetStateAction<DeclarationTransport>>;
  readOnly?: boolean;
}

export default function TransportTab({
  transport,
  setTransport,
  readOnly = false,
}: TransportTabProps) {
  const t = transport as any;

  return (
    <div className="space-y-6">
      {/* =========================================================
          TRANSPORT SECTION TITLE
         ========================================================= */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Transport</h2>

        <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
          Define how the shipment moves so declaration routing and logistics
          references remain clear.
        </p>

        {readOnly && (
          <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
            Read-only
          </div>
        )}
      </div>

      {/* =========================================================
          TRANSPORT INPUT GRID
         ========================================================= */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Mode
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Mode"
            value={t.mode || ""}
            disabled={readOnly}
            onChange={(e) =>
              setTransport({
                ...(transport as any),
                mode: e.target.value,
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Carrier
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Carrier"
            value={t.carrier || ""}
            disabled={readOnly}
            onChange={(e) =>
              setTransport({
                ...(transport as any),
                carrier: e.target.value,
              })
            }
          />
        </div>

        <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Vehicle Number
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            placeholder="Vehicle Number"
            value={t.vehicleNumber || ""}
            disabled={readOnly}
            onChange={(e) =>
              setTransport({
                ...(transport as any),
                vehicleNumber: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* =========================================================
          TRANSPORT NOTE
         ========================================================= */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-blue-900">
          Transport details should match shipment documents and container
          references before declaration submission.
        </p>
      </div>
    </div>
  );
}