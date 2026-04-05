// app/portal/[transiterId]/declarations/[declarationId]/page.tsx
// DECLARATION WORKSPACE HOME PAGE
// PURPOSE:
// This page is the main declaration preparation workspace for one declaration record.
//
// WHAT THIS PAGE DOES:
// - loads one declaration using transiterId + declarationId
// - shows key declaration summary information
// - displays assessment, supporting documents, and container details
// - renders the main declaration builder workflow
// - helps the user move toward final CTP submission readiness
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Declaration page identity / top summary
// 2. Declaration summary tiles
// 3. Preparation guide + assessment section
// 4. Supporting documents + containers
// 5. Main declaration builder
//
// ROUTE:
// /portal/[transiterId]/declarations/[declarationId]

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useDeclaration } from "../../../../../hooks/useDeclarations";

// These components are located at: simlog-web/app/components/Declaration
import * as DeclarationWizardModule from "../../../../components/Declaration/DeclarationWizard";
import * as AssessmentNoticeModule from "../../../../components/Declaration/AssessmentNotice";
import * as DeclarationStatusPillModule from "../../../../components/Declaration/DeclarationStatusPill";
import * as DocumentsTabModule from "../../../../components/Declaration/DocumentsTab";
import * as ContainersTabModule from "../../../../components/Declaration/ContainersTab";

export default function DeclarationWorkspaceHomePage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");
  const declarationId = String(params?.declarationId || "");

  const {
    declaration: rawDeclaration,
    loading,
    error,
  } = useDeclaration(transiterId, declarationId);

  // Safe resolution whether each component is exported as default or named export
  const DeclarationWizard =
    (DeclarationWizardModule as any).default ||
    (DeclarationWizardModule as any).DeclarationWizard;

  const AssessmentNotice =
    (AssessmentNoticeModule as any).default ||
    (AssessmentNoticeModule as any).AssessmentNotice;

  const DeclarationStatusPill =
    (DeclarationStatusPillModule as any).default ||
    (DeclarationStatusPillModule as any).DeclarationStatusPill;

  const DocumentsTab =
    (DocumentsTabModule as any).default ||
    (DocumentsTabModule as any).DocumentsTab;

  const ContainersTab =
    (ContainersTabModule as any).default ||
    (ContainersTabModule as any).ContainersTab;

  const declaration = useMemo(
    () => ({
      id: rawDeclaration?.id || declarationId || "demo",
      declarationNumber:
        rawDeclaration?.declarationNumber || `DEC-${declarationId || "DEMO"}`,
      customerName: rawDeclaration?.customerName || "Unassigned Customer",
      status: rawDeclaration?.status || "DRAFT",
      customsOffice: rawDeclaration?.customsOffice || "Not assigned",
      regime: rawDeclaration?.regime || "Import",
      originCountry: rawDeclaration?.originCountry || "Not provided",
      currency: rawDeclaration?.currency || "ETB",
      invoiceValue: rawDeclaration?.invoiceValue || "0",
      lastUpdated: rawDeclaration?.updatedAt
        ? "Recently updated"
        : "No recent update",
       totals: (rawDeclaration as any)?.totals|| {
        cif: 0,
        duty: 0,
        vat: 0,
        excise: 0,
        grandTotal: 0,
      },
    }),
    [rawDeclaration, declarationId]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Customer",
        value: declaration.customerName,
        note: "Customer linked to this declaration record.",
        cardClass: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
        labelClass: "text-blue-700",
        valueClass: "text-blue-900",
      },
      {
        label: "Customs Office",
        value: declaration.customsOffice,
        note: "Declared customs office for processing.",
        cardClass:
          "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
        labelClass: "text-emerald-700",
        valueClass: "text-emerald-900",
      },
      {
        label: "Origin Country",
        value: declaration.originCountry,
        note: "Country of origin referenced in this declaration.",
        cardClass:
          "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100",
        labelClass: "text-slate-700",
        valueClass: "text-slate-900",
      },
      {
        label: "Invoice Value",
        value: `${declaration.currency} ${declaration.invoiceValue}`,
        note: "Current working invoice value in this declaration file.",
        cardClass:
          "border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-100",
        labelClass: "text-violet-700",
        valueClass: "text-violet-900",
      },
    ],
    [declaration]
  );

  const workflowNotes = useMemo(
    () => [
      "Review declaration header and party details first.",
      "Confirm uploaded support documents before finalizing line items.",
      "Use tax estimates as a working reference before final submission preparation.",
      "Check containers and assessment details before moving toward submission readiness.",
    ],
    []
  );

  return (
    <div className="space-y-10">
      {/* =========================================================
          DECLARATION PAGE HERO / PAGE IDENTITY
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
              Declaration Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Declaration Workspace Home
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              This is the main declaration preparation page. Review
              customer-linked information, confirm documents, check containers,
              and continue toward final CTP submission readiness.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                {loading ? "Loading..." : declaration.declarationNumber}
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Updated {declaration.lastUpdated}
              </div>

              {DeclarationStatusPill ? (
                <DeclarationStatusPill status={declaration.status} />
              ) : (
                <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-amber-700">
                  {declaration.status}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Customers
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/dashboard`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                Return to Dashboard
              </div>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
            <p className="text-lg font-semibold leading-relaxed text-rose-700">
              {error}
            </p>
          </div>
        ) : null}
      </section>

      {/* =========================================================
          DECLARATION SUMMARY TILES
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Declaration Summary
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Key Information at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These summary cards show the main reference details linked to this
            declaration file.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className={`rounded-[1.75rem] border p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.cardClass}`}
            >
              <p
                className={`text-sm font-extrabold uppercase tracking-[0.2em] ${item.labelClass}`}
              >
                {item.label}
              </p>
              <p
                className={`mt-4 text-3xl font-extrabold tracking-tight ${item.valueClass}`}
              >
                {loading ? "..." : item.value}
              </p>
              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          PREPARATION GUIDE + ASSESSMENT SECTION
         ========================================================= */}
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Preparation Guide
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Recommended Working Order
          </h2>

          <div className="mt-8 space-y-4">
            {workflowNotes.map((note, index) => (
              <div
                key={`${note}-${index}`}
                className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-extrabold text-white">
                  {index + 1}
                </div>
                <p className="text-lg font-semibold leading-relaxed text-slate-700">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-700">
            Assessment Section
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Review Assessment Information
          </h2>
          <p className="mb-6 mt-3 text-lg font-semibold leading-relaxed text-slate-600">
            Review the assessment area for financial and customs response
            details connected to this declaration.
          </p>

          {AssessmentNotice ? (
            <AssessmentNotice totals={declaration.totals} />
          ) : (
            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-6">
              <p className="text-lg font-semibold leading-relaxed text-slate-700">
                AssessmentNotice component is not available yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          SUPPORTING DOCUMENTS + CONTAINERS
         ========================================================= */}
      <section className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
            Supporting Documents
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Declaration Documents
          </h2>
          <p className="mb-6 mt-3 text-lg font-semibold leading-relaxed text-slate-600">
            Review uploaded files and verify that this declaration is supported
            by the required documentation.
          </p>

          {DocumentsTab ? (
            <DocumentsTab />
          ) : (
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6">
              <p className="text-lg font-semibold leading-relaxed text-slate-700">
                DocumentsTab component is not available yet.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Shipment Structure
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Containers and Shipment Details
          </h2>
          <p className="mb-6 mt-3 text-lg font-semibold leading-relaxed text-slate-600">
            Review or organize container details that belong to this
            declaration file.
          </p>

          {ContainersTab ? (
            <ContainersTab />
          ) : (
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-lg font-semibold leading-relaxed text-slate-700">
                ContainersTab component is not available yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          MAIN DECLARATION BUILDER
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Main Builder
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Structured Declaration Preparation
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            Use the builder below to work through header, parties, transport,
            items, financial details, documents, and final declaration review.
          </p>
        </div>

        {DeclarationWizard ? (
          <DeclarationWizard
            slug={transiterId}
            declarationId={declarationId}
          />
        ) : (
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
            <p className="text-xl font-semibold leading-relaxed text-slate-700">
              DeclarationWizard component is not available yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}