// app/portal/[transiterId]/declarations/page.tsx
// DECLARATION WORKSPACE LIST PAGE
// PURPOSE:
// This page is the main declaration listing workspace for one transiter.
//
// WHAT THIS PAGE DOES:
// - loads all declarations under one transiter workspace
// - shows summary counts for declaration workflow status
// - allows search and filtering across declaration records
// - opens an individual declaration workspace
// - provides the main entry point to review and continue declaration work
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / declaration workspace overview
// 2. Declaration summary cards
// 3. Search and filter tools
// 4. Declaration record listing
//
// ROUTE:
// /portal/[transiterId]/declarations

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDeclarations } from "../../../../hooks/useDeclarations";

type DeclarationStatus =
  | "DRAFT"
  | "VERIFIED"
  | "ASSESSED"
  | "SUBMITTED"
  | "PAID"
  | "RELEASED"
  | "CANCELLED";

type DeclarationViewModel = {
  id: string;
  declarationNumber: string;
  customerName: string;
  status: DeclarationStatus;
  customsOffice: string;
  regime: string;
  originCountry: string;
  invoiceValue: string;
  updatedAt: string;
};

export default function DeclarationWorkspaceListPage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const {
    declarations = [],
    loading,
    error,
  } = useDeclarations(transiterId) as {
    declarations: any[];
    loading: boolean;
    error: string | null;
  };

  const normalizedDeclarations = useMemo<DeclarationViewModel[]>(() => {
    return declarations.map((declaration) => {
      const rawStatus = String(declaration.status || "DRAFT").trim().toUpperCase();

      const status: DeclarationStatus =
        rawStatus === "DRAFT" ||
        rawStatus === "VERIFIED" ||
        rawStatus === "ASSESSED" ||
        rawStatus === "SUBMITTED" ||
        rawStatus === "PAID" ||
        rawStatus === "RELEASED" ||
        rawStatus === "CANCELLED"
          ? rawStatus
          : "DRAFT";

      return {
        id: declaration.id,
        declarationNumber:
          declaration.declarationNumber || `DEC-${declaration.id}`,
        customerName: declaration.customerName || "Unassigned Customer",
        status,
        customsOffice: declaration.customsOffice || "Not assigned",
        regime: declaration.regime || "Import",
        originCountry: declaration.originCountry || "Not provided",
        invoiceValue:
          declaration.invoiceValue !== undefined &&
          declaration.invoiceValue !== null
            ? String(declaration.invoiceValue)
            : "0",
        updatedAt: declaration.updatedAt ? "Recently updated" : "No recent update",
      };
    });
  }, [declarations]);

  const filteredDeclarations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return normalizedDeclarations.filter((declaration) => {
      const matchesSearch =
        !term ||
        declaration.declarationNumber.toLowerCase().includes(term) ||
        declaration.customerName.toLowerCase().includes(term) ||
        declaration.customsOffice.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" ? true : declaration.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedDeclarations, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: normalizedDeclarations.length,
      draft: normalizedDeclarations.filter((d) => d.status === "DRAFT").length,
      submitted: normalizedDeclarations.filter((d) => d.status === "SUBMITTED")
        .length,
      released: normalizedDeclarations.filter((d) => d.status === "RELEASED")
        .length,
    };
  }, [normalizedDeclarations]);

  const getStatusClasses = (status: DeclarationStatus) => {
    switch (status) {
      case "DRAFT":
        return "border border-slate-200 bg-slate-100 text-slate-700";
      case "VERIFIED":
        return "border border-blue-200 bg-blue-100 text-blue-700";
      case "ASSESSED":
        return "border border-emerald-200 bg-emerald-100 text-emerald-700";
      case "SUBMITTED":
        return "border border-violet-200 bg-violet-100 text-violet-700";
      case "PAID":
        return "border border-cyan-200 bg-cyan-100 text-cyan-700";
      case "RELEASED":
        return "border border-lime-200 bg-lime-100 text-lime-700";
      case "CANCELLED":
        return "border border-rose-200 bg-rose-100 text-rose-700";
      default:
        return "border border-slate-200 bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-10">
      {/* =========================================================
          PAGE HERO / PAGE IDENTITY
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
              Declaration Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Declaration Workspace List
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              Manage all declaration records under this transiter workspace.
              Open an existing declaration to continue workflow progress, review
              status, and move toward final CTP submission readiness.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                Open Customers
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/dashboard`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Dashboard
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          DECLARATION SUMMARY CARDS
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Declaration Summary
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Declaration Activity at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Use these summary cards to understand the current declaration
            portfolio across this transiter workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Total Declarations
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-blue-900">
              {loading ? "..." : summary.total}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              All declaration records currently available in this workspace.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-700">
              Draft
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-slate-900">
              {loading ? "..." : summary.draft}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Declarations still under preparation and internal review.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-violet-700">
              Submitted
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-violet-900">
              {loading ? "..." : summary.submitted}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Declarations already advanced into formal submission workflow.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-lime-100 bg-gradient-to-br from-lime-50 to-emerald-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-lime-700">
              Released
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-lime-900">
              {loading ? "..." : summary.released}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Declarations that completed the workflow successfully.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          SEARCH AND FILTER TOOLS
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Search and Filter
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Find the Right Declaration Quickly
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Search by declaration number, customer name, or customs office, then
            filter by status to narrow the workspace view.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.5fr_0.7fr]">
          <div>
            <label
              htmlFor="declaration-search"
              className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500"
            >
              Search Declarations
            </label>
            <input
              id="declaration-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by declaration number, customer, or customs office..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500"
            >
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="All">All</option>
              <option value="DRAFT">Draft</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSESSED">Assessed</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PAID">Paid</option>
              <option value="RELEASED">Released</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================
          DECLARATION RECORD LIST
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
            Declaration Records
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Open a Declaration Workspace
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Each declaration record becomes the main working place for
            preparation, assessment, and final CTP submission workflow.
          </p>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
              <h3 className="text-3xl font-extrabold text-slate-900">
                Loading Declarations...
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-slate-600">
                Please wait while declaration records are loaded.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center shadow-xl">
              <h3 className="text-3xl font-extrabold text-rose-900">
                Failed to Load Declarations
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-rose-700">
                {error}
              </p>
            </div>
          ) : filteredDeclarations.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
                🧾
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900">
                No Declarations Found
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-slate-600">
                No declaration record matched your search or status filter. Open
                customers and start declaration preparation from a customer
                workspace.
              </p>

              <div className="mt-8">
                <Link href={`/portal/${transiterId}/customers`}>
                  <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                    Open Customers
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            filteredDeclarations.map((declaration) => (
              <Link
                key={declaration.id}
                href={`/portal/${transiterId}/declarations/${declaration.id}`}
              >
                <div className="group cursor-pointer rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-2xl text-white shadow-md">
                          🧾
                        </span>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] ${getStatusClasses(
                            declaration.status
                          )}`}
                        >
                          {declaration.status}
                        </span>
                      </div>

                      <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                        {declaration.declarationNumber}
                      </h3>

                      <p className="mt-3 text-xl font-semibold leading-relaxed text-slate-600">
                        Customer: {declaration.customerName}
                      </p>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Customs Office
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {declaration.customsOffice}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Regime
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {declaration.regime}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Origin Country
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {declaration.originCountry}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Updated
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {declaration.updatedAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:min-w-[220px]">
                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                            Invoice Value
                          </p>
                          <p className="mt-2 text-4xl font-extrabold text-violet-900">
                            {declaration.invoiceValue}
                          </p>
                        </div>

                        <div className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition group-hover:from-blue-700 group-hover:to-indigo-700">
                          <span>Open Declaration Workspace</span>
                          <span
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}