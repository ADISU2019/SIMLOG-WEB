// app/portal/[transiterId]/customers/[customerId]/page.tsx
// CUSTOMER WORKSPACE HOME PAGE
// PURPOSE:
// This page is the main operational workspace for one customer record.
//
// WHAT THIS PAGE DOES:
// - loads one customer under a specific transiter
// - shows customer identity, contact details, and workflow status
// - gives quick access to documents, tax simulation, and declaration preparation
// - acts as the main control center for customer-level customs preparation work
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / customer workspace overview
// 2. Customer activity summary tiles
// 3. Customer record details
// 4. Customer workflow tabs
//
// ROUTE:
// /portal/[transiterId]/customers/[customerId]

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useCustomer } from "../../../../../hooks/useCustomers";

type CustomerStatus = "Active" | "Pending" | "On Hold";
type TabKey = "overview" | "documents" | "tax" | "declaration";

type CustomerViewModel = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  tin: string;
  address: string;
  status: CustomerStatus;
  lastUpdated: string;
};

export default function CustomerWorkspaceHomePage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");
  const customerId = String(params?.customerId || "");

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { customer: rawCustomer, loading, error } = useCustomer(
    transiterId,
    customerId
  );

  const customer = useMemo<CustomerViewModel>(() => {
    const rawStatus = (rawCustomer?.status || "Pending").toString().trim();

    const status: CustomerStatus =
      rawStatus === "Active" ||
      rawStatus === "Pending" ||
      rawStatus === "On Hold"
        ? rawStatus
        : "Pending";

    return {
      id: rawCustomer?.id || customerId || "customer-demo",
      name: rawCustomer?.name || "Unnamed Customer",
      contactPerson: rawCustomer?.contactPerson || "Not provided",
      phone: rawCustomer?.phone || "Not provided",
      email: rawCustomer?.email || "Not provided",
      tin: rawCustomer?.tin || "Not provided",
      address: (rawCustomer as any)?.address || "Not provided",
      status,
      lastUpdated: rawCustomer?.updatedAt
        ? "Recently updated"
        : "No recent update",
    };
  }, [rawCustomer, customerId]);

  const overviewStats = useMemo(
    () => [
      {
        label: "Stored Documents",
        value: String(rawCustomer?.documents ?? 0).padStart(2, "0"),
        note: "Files currently available for this customer.",
        cardClass:
          "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
        textClass: "text-blue-900",
        labelClass: "text-blue-700",
      },
      {
        label: "Draft Declarations",
        value: String(rawCustomer?.declarations ?? 0).padStart(2, "0"),
        note: "Declarations in progress before final submission.",
        cardClass:
          "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
        textClass: "text-emerald-900",
        labelClass: "text-emerald-700",
      },
      {
        label: "Pending Reviews",
        value: "02",
        note: "Items that may need review before continuing.",
        cardClass:
          "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100",
        textClass: "text-slate-900",
        labelClass: "text-slate-700",
      },
    ],
    [rawCustomer]
  );

  const documentTiles = useMemo(
    () => [
      {
        title: "Commercial Invoice",
        subtitle: "Primary import document",
        status: "Uploaded",
        updated: "Updated today",
        cardClass:
          "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
        iconWrap: "bg-blue-600",
      },
      {
        title: "Packing List",
        subtitle: "Shipment support document",
        status: "Uploaded",
        updated: "Updated yesterday",
        cardClass:
          "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
        iconWrap: "bg-emerald-600",
      },
      {
        title: "Bill of Lading",
        subtitle: "Transport document",
        status: "Pending",
        updated: "Awaiting upload",
        cardClass:
          "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100",
        iconWrap: "bg-slate-600",
      },
    ],
    []
  );

  const taxSummary = useMemo(
    () => [
      {
        label: "Estimated Duty",
        value: "ETB 125,000",
      },
      {
        label: "Estimated VAT",
        value: "ETB 78,500",
      },
      {
        label: "Estimated Surtax",
        value: "ETB 21,300",
      },
      {
        label: "Estimated Total",
        value: "ETB 224,800",
      },
    ],
    []
  );

  const declarationSteps = useMemo(
    () => [
      {
        step: "01",
        title: "Review customer information",
        text: "Confirm customer identity, contact details, and tax information before starting declaration work.",
      },
      {
        step: "02",
        title: "Confirm documents",
        text: "Verify that key support documents are uploaded and ready for the declaration workflow.",
      },
      {
        step: "03",
        title: "Check tax estimates",
        text: "Use the tax simulation results as reference before preparing the final declaration package.",
      },
      {
        step: "04",
        title: "Build declaration for CTP",
        text: "Prepare the structured declaration and continue toward final submission readiness.",
      },
    ],
    []
  );

  const getStatusClasses = (status: CustomerStatus) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Pending":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "On Hold":
        return "bg-slate-200 text-slate-700 border border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const tabButtonClass = (tab: TabKey) =>
    activeTab === tab
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <div className="space-y-10">
      {/* =========================================================
          PAGE HERO / PAGE IDENTITY
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
              Customer Workspace Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              {loading ? "Loading Customer..." : customer.name}
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              This is the main working page for this customer. From here you can
              review customer information, manage documents, run tax simulation,
              and continue to declaration preparation for CTP.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] ${getStatusClasses(
                  customer.status
                )}`}
              >
                {customer.status}
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-600">
                Updated {customer.lastUpdated}
              </span>

              {error ? (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-rose-700">
                  Data Load Warning
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Customers
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/customers/${customerId}/edit`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-6 py-3 text-lg font-extrabold text-blue-700 transition hover:bg-blue-100">
                Edit Customer
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/declarations/demo`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                Open Declaration Builder
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
          CUSTOMER ACTIVITY SUMMARY TILES
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Customer Overview
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Current Activity for This Customer
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These tiles summarize the current document, declaration, and review
            activity for this customer record.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {overviewStats.map((item) => (
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
                className={`mt-4 text-5xl font-extrabold tracking-tight ${item.textClass}`}
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
          CUSTOMER RECORD DETAILS
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-slate-700">
            Customer Record
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Customer Information
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Review the customer identity and core profile details before
            continuing with documents, tax work, or declaration preparation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Customer Name
            </p>
            <p className="mt-2 text-2xl font-extrabold text-blue-900">
              {loading ? "Loading..." : customer.name}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
              Contact Person
            </p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-900">
              {loading ? "Loading..." : customer.contactPerson}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
              TIN
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {loading ? "Loading..." : customer.tin}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
              Phone
            </p>
            <p className="mt-2 text-2xl font-extrabold text-blue-900">
              {loading ? "Loading..." : customer.phone}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
              Email
            </p>
            <p className="mt-2 break-all text-2xl font-extrabold text-emerald-900">
              {loading ? "Loading..." : customer.email}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
              Address
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {loading ? "Loading..." : customer.address}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          CUSTOMER WORKFLOW TABS
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Customer Workflow
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Work Through the Main Preparation Steps
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Use these sections to move from document preparation to tax review
            and final declaration building.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-2xl px-5 py-4 text-base font-extrabold transition ${tabButtonClass(
              "overview"
            )}`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`rounded-2xl px-5 py-4 text-base font-extrabold transition ${tabButtonClass(
              "documents"
            )}`}
          >
            Documents
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax")}
            className={`rounded-2xl px-5 py-4 text-base font-extrabold transition ${tabButtonClass(
              "tax"
            )}`}
          >
            Tax Simulation
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("declaration")}
            className={`rounded-2xl px-5 py-4 text-base font-extrabold transition ${tabButtonClass(
              "declaration"
            )}`}
          >
            Declaration Builder
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7">
              <h3 className="text-2xl font-extrabold text-slate-900">
                Overview
              </h3>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                This customer workspace brings together the full customs
                preparation process for one customer record. Start with customer
                details, confirm documents, review tax estimates, and continue
                to declaration preparation.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6">
                <h4 className="text-2xl font-extrabold text-blue-900">
                  Recommended First Step
                </h4>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-700">
                  Review customer information and confirm that the key business
                  and customs details are correct.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6">
                <h4 className="text-2xl font-extrabold text-emerald-900">
                  Recommended Next Step
                </h4>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-700">
                  Open the documents section and make sure the main support files
                  are uploaded before continuing.
                </p>
              </div>

              <Link href={`/portal/${transiterId}/customers/${customerId}/documents`}>
                <div className="cursor-pointer rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6 transition hover:shadow-lg">
                  <h4 className="text-2xl font-extrabold text-blue-900">
                    Open Document Vault
                  </h4>
                  <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-700">
                    Go directly to the customer document vault and manage all
                    supporting files.
                  </p>
                </div>
              </Link>

              <Link href={`/portal/${transiterId}/customers/${customerId}/tax`}>
                <div className="cursor-pointer rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6 transition hover:shadow-lg">
                  <h4 className="text-2xl font-extrabold text-emerald-900">
                    Open Tax Simulation
                  </h4>
                  <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-700">
                    Review estimated customs-related charges before declaration
                    preparation.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Documents
                </h3>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                  Review the key support documents available for this customer and
                  identify what is still missing before declaration preparation.
                </p>
              </div>

              <Link href={`/portal/${transiterId}/customers/${customerId}/documents`}>
                <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700">
                  Open Document Vault
                </div>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {documentTiles.map((doc) => (
                <div
                  key={doc.title}
                  className={`rounded-[1.75rem] border p-6 shadow-lg ${doc.cardClass}`}
                >
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-md ${doc.iconWrap}`}
                  >
                    📄
                  </div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-600">
                    {doc.subtitle}
                  </p>
                  <h4 className="mt-3 text-2xl font-extrabold text-slate-900">
                    {doc.title}
                  </h4>
                  <p className="mt-4 text-lg font-semibold text-slate-700">
                    Status: {doc.status}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-600">
                    {doc.updated}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tax" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Tax Simulation
                </h3>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                  Use these estimates as a working reference before final
                  declaration preparation and submission.
                </p>
              </div>

              <Link href={`/portal/${transiterId}/customers/${customerId}/tax`}>
                <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                  Open Tax Page
                </div>
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {taxSummary.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-[1.5rem] border p-6 shadow-lg ${
                    index % 3 === 0
                      ? "border-blue-100 bg-blue-50"
                      : index % 3 === 1
                      ? "border-emerald-100 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-100 p-6">
              <p className="text-lg font-semibold leading-relaxed text-slate-700">
                These values are sample placeholders for now. This section can
                connect directly to your real tax calculation logic.
              </p>
            </div>
          </div>
        )}

        {activeTab === "declaration" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Declaration Builder for CTP
              </h3>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                Follow the steps below to move from customer preparation to
                final declaration readiness.
              </p>
            </div>

            <div className="grid gap-5">
              {declarationSteps.map((item) => (
                <div
                  key={item.step}
                  className="flex gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg font-extrabold text-white shadow-md">
                    {item.step}
                  </div>

                  <div>
                    <h4 className="text-2xl font-extrabold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link href={`/portal/${transiterId}/declarations/demo`}>
              <div className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700">
                <span>Continue to Declaration Builder</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}