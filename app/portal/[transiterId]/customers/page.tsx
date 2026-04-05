// app/portal/[transiterId]/customers/page.tsx
// CUSTOMER WORKSPACE LIST PAGE
// PURPOSE:
// This page is the main customer listing workspace for one transiter.
//
// WHAT THIS PAGE DOES:
// - loads all customers under one transiter
// - shows summary counts for customer workflow status
// - allows search and filtering across customer records
// - opens an individual customer workspace
// - provides the main entry point to create a new customer
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / customer workspace overview
// 2. Customer summary cards
// 3. Search and filter tools
// 4. Customer record listing
//
// ROUTE:
// /portal/[transiterId]/customers

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useCustomers } from "../../../../hooks/useCustomers";

type CustomerStatus = "Active" | "Pending" | "On Hold";

type CustomerViewModel = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  tin: string;
  status: CustomerStatus;
  declarations: number;
  documents: number;
  updatedAt: string;
};

export default function CustomerWorkspaceListPage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { customers, loading, error } = useCustomers(transiterId);

  const normalizedCustomers = useMemo<CustomerViewModel[]>(() => {
    return customers.map((customer) => {
      const rawStatus = (customer.status || "Pending").toString().trim();

      const status: CustomerStatus =
        rawStatus === "Active" ||
        rawStatus === "Pending" ||
        rawStatus === "On Hold"
          ? rawStatus
          : "Pending";

      return {
        id: customer.id,
        name: customer.name || "Unnamed Customer",
        contactPerson: customer.contactPerson || "Not provided",
        phone: customer.phone || "Not provided",
        email: customer.email || "Not provided",
        tin: customer.tin || "Not provided",
        status,
        declarations: Number(customer.declarations ?? 0),
        documents: Number(customer.documents ?? 0),
        updatedAt: customer.updatedAt ? "Recently updated" : "No recent update",
      };
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return normalizedCustomers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        customer.tin.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedCustomers, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: normalizedCustomers.length,
      active: normalizedCustomers.filter((c) => c.status === "Active").length,
      pending: normalizedCustomers.filter((c) => c.status === "Pending").length,
      onHold: normalizedCustomers.filter((c) => c.status === "On Hold").length,
    };
  }, [normalizedCustomers]);

  const getStatusClasses = (status: CustomerStatus) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Pending":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "On Hold":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
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
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
              Customer Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Customer Workspace List
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              Manage all customer records under this transiter workspace. Open a
              customer profile to continue with documents, tax simulation, and
              declaration preparation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers/new`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                + Add Customer
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
          CUSTOMER SUMMARY CARDS
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
            Customer Summary
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Customer Activity at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Use these summary cards to understand the current customer portfolio
            across this transiter workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Total Customers
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-blue-900">
              {loading ? "..." : summary.total}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              All customer records currently available in this workspace.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">
              Active Customers
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-emerald-900">
              {loading ? "..." : summary.active}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Customers currently active in document and declaration workflows.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-amber-700">
              Pending
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-amber-900">
              {loading ? "..." : summary.pending}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Customer records that may still need additional setup or review.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-100 p-7 shadow-lg">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-rose-700">
              On Hold
            </p>
            <p className="mt-4 text-5xl font-extrabold tracking-tight text-rose-900">
              {loading ? "..." : summary.onHold}
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
              Customer files temporarily paused or waiting for next action.
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
            Find the Right Customer Quickly
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Search by customer name, contact person, or TIN, then filter by
            status to narrow the workspace view.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.5fr_0.7fr]">
          <div>
            <label
              htmlFor="customer-search"
              className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500"
            >
              Search Customers
            </label>
            <input
              id="customer-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, contact person, or TIN..."
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
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================
          CUSTOMER RECORD LIST
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Customer Records
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Open a Customer Workspace
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Each customer record becomes the main working place for documents,
            tax simulation, and declaration preparation.
          </p>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
              <h3 className="text-3xl font-extrabold text-slate-900">
                Loading Customers...
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-slate-600">
                Please wait while customer records are loaded.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center shadow-xl">
              <h3 className="text-3xl font-extrabold text-rose-900">
                Failed to Load Customers
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-rose-700">
                {error}
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
                👥
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900">
                No Customers Found
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-relaxed text-slate-600">
                No customer record matched your search or status filter. Try
                adjusting the filters or add a new customer.
              </p>

              <div className="mt-8">
                <Link href={`/portal/${transiterId}/customers/new`}>
                  <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                    Create New Customer
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/portal/${transiterId}/customers/${customer.id}`}
              >
                <div className="group cursor-pointer rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-2xl text-white shadow-md">
                          👤
                        </span>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] ${getStatusClasses(
                            customer.status
                          )}`}
                        >
                          {customer.status}
                        </span>
                      </div>

                      <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                        {customer.name}
                      </h3>

                      <p className="mt-3 text-xl font-semibold leading-relaxed text-slate-600">
                        Primary contact: {customer.contactPerson}
                      </p>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Phone
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {customer.phone}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Email
                          </p>
                          <p className="mt-2 break-all text-lg font-extrabold text-slate-900">
                            {customer.email}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            TIN
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {customer.tin}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                            Updated
                          </p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">
                            {customer.updatedAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:min-w-[220px]">
                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                            Declarations
                          </p>
                          <p className="mt-2 text-4xl font-extrabold text-blue-900">
                            {customer.declarations}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                            Documents
                          </p>
                          <p className="mt-2 text-4xl font-extrabold text-emerald-900">
                            {customer.documents}
                          </p>
                        </div>

                        <div className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition group-hover:from-blue-700 group-hover:to-indigo-700">
                          <span>Open Customer Workspace</span>
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