// app/components/Declaration/ItemsTab.tsx
// DECLARATION ITEMS TAB
// PURPOSE:
// This component manages declaration line items.
//
// WHAT THIS COMPONENT DOES:
// - lists all declaration items
// - allows new items to be added
// - allows items to be removed
// - allows description, quantity, and unit price to be edited
// - supports read-only mode
//
// USED INSIDE:
// DeclarationWizard.tsx
//
// IMPORTANT:
// Items are one of the most important parts of the declaration because
// assessment totals are driven by the declared goods.
// This tab should stay clear, stable, and easy to review.

import React from "react";
import { DeclarationItem } from "@/types/declaration";

interface ItemsTabProps {
  items: DeclarationItem[];
  setItems: React.Dispatch<React.SetStateAction<DeclarationItem[]>>;
  readOnly?: boolean;
}

export default function ItemsTab({
  items,
  setItems,
  readOnly = false,
}: ItemsTabProps) {
  const arr = (items as any[]) ?? [];

  const addItem = () => {
    if (readOnly) return;
    setItems([
      ...(items as any[]),
      { description: "", quantity: 1, unitPrice: 0 },
    ] as any);
  };

  const removeItem = (idx: number) => {
    if (readOnly) return;
    const next = [...(items as any[])];
    next.splice(idx, 1);
    setItems(next as any);
  };

  const updateItem = (idx: number, patch: any) => {
    if (readOnly) return;
    const next = [...(items as any[])];
    next[idx] = { ...(next[idx] ?? {}), ...patch };
    setItems(next as any);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          ITEMS SECTION TITLE
         ========================================================= */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Items</h2>

          <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
            Add and review the goods declared in this file. These item lines
            drive valuation, assessment, and declaration totals.
          </p>

          {readOnly && (
            <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500">
              Read-only
            </div>
          )}
        </div>

        <button
          type="button"
          className="rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={readOnly}
          onClick={addItem}
        >
          + Add Item
        </button>
      </div>

      {/* =========================================================
          EMPTY STATE
         ========================================================= */}
      {arr.length === 0 ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-slate-500">
          <p className="text-lg font-semibold">No items yet.</p>
          <p className="mt-2 text-sm">
            Add at least one declaration item before assessment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {arr.map((it, idx) => {
            const quantity = Number(it.quantity ?? 0);
            const unitPrice = Number(it.unitPrice ?? 0);
            const lineTotal = quantity * unitPrice;

            return (
              <div
                key={idx}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">
                      Item {idx + 1}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">
                      Declaration goods line
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-extrabold text-red-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={readOnly}
                    onClick={() => removeItem(idx)}
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1rem] border border-slate-100 bg-slate-50 p-4">
                    <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
                      Description
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-900 outline-none"
                      placeholder="Description"
                      value={it.description || ""}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateItem(idx, { description: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1rem] border border-slate-100 bg-slate-50 p-4">
                      <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
                        Quantity
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-900 outline-none"
                        placeholder="Quantity"
                        value={it.quantity ?? ""}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateItem(idx, {
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="rounded-[1rem] border border-slate-100 bg-slate-50 p-4">
                      <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-slate-500">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 font-semibold text-slate-900 outline-none"
                        placeholder="Unit Price"
                        value={it.unitPrice ?? ""}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateItem(idx, {
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50 p-4">
                      <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.15em] text-emerald-700">
                        Line Total
                      </label>
                      <div className="rounded-xl bg-white p-3 text-lg font-extrabold text-emerald-900">
                        {lineTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          ITEMS NOTE
         ========================================================= */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold leading-relaxed text-blue-900">
          Make sure item descriptions, quantities, and values are correct before
          running assessment, because declaration totals depend on these lines.
        </p>
      </div>
    </div>
  );
}