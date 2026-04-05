// app/portal/[transiterId]/customers/new/page.tsx
// CREATE NEW CUSTOMER WORKSPACE PAGE
// PURPOSE:
// This page creates a new customer under one transiter workspace.
//
// WHAT THIS PAGE DOES:
// - collects the main business identity of a customer
// - captures contact and operational details
// - saves a real customer record into Firestore
// - prepares the starting record for documents, tax simulation, and declarations
// - acts as the entry point into the full customer workflow
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / creation purpose
// 2. Business information form
// 3. Contact information form
// 4. Workflow settings
// 5. New customer preview
// 6. Save actions
//
// ROUTE:
// /portal/[transiterId]/customers/new

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createCustomerRecord,
  type CustomerStatus,
} from "../../../../lib/customerCrud";

export default function CreateNewCustomerWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const transiterId = String(params?.transiterId || "");

  const [customerName, setCustomerName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");

  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<CustomerStatus>("Active");
  const [internalReference, setInternalReference] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  const customerPreviewId = useMemo(() => {
    const base = customerName.trim().toLowerCase();
    if (!base) return "new-customer";

    return base
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [customerName]);

  const isFormValid = useMemo(() => {
    return (
      customerName.trim().length > 1 &&
      contactPerson.trim().length > 1 &&
      phone.trim().length > 3
    );
  }, [customerName, contactPerson, phone]);

  const handleSaveCustomer = async () => {
    try {
      setSubmitting(true);
      setSaveError("");

      await createCustomerRecord(transiterId, {
        name: customerName,
        companyType,
        tin,
        address,
        contactPerson,
        phone,
        email,
        status,
        internalReference,
        notes,
      });

      router.push(`/portal/${transiterId}/customers`);
    } catch (error) {
      console.error("Error creating customer:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to create the customer record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndOpenWorkspace = async () => {
    try {
      setSubmitting(true);
      setSaveError("");

      const createdCustomer = await createCustomerRecord(transiterId, {
        name: customerName,
        companyType,
        tin,
        address,
        contactPerson,
        phone,
        email,
        status,
        internalReference,
        notes,
      });

      router.push(`/portal/${transiterId}/customers/${createdCustomer.id}`);
    } catch (error) {
      console.error("Error creating customer:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to create the customer record."
      );
    } finally {
      setSubmitting(false);
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
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
              Customer Creation Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Create New Customer Workspace
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              Use this page to create a new customer under this transiter. Once
              the customer is saved, that record becomes the starting point for
              documents, tax simulation, and declaration preparation.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Transiter: {transiterId || "transiter"}
              </div>

              <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">
                New Customer Setup
              </div>
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

        {saveError ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
            <p className="text-lg font-semibold leading-relaxed text-rose-700">
              {saveError}
            </p>
          </div>
        ) : null}
      </section>

      {/* =========================================================
          BUSINESS INFORMATION
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Business Information
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Define the Customer Identity
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Enter the business details that identify the customer in the
            transiter workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer company name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Company Type
            </label>
            <input
              type="text"
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              placeholder="Importer, wholesaler, manufacturer..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              TIN
            </label>
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="Enter tax identification number"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Internal Reference
            </label>
            <input
              type="text"
              value={internalReference}
              onChange={(e) => setInternalReference(e.target.value)}
              placeholder="Optional internal reference code"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter customer address"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT INFORMATION
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Contact Information
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Define the Main Contact Record
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Add the person and communication details that will be used for the
            customer workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Enter main contact person"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          WORKFLOW SETTINGS + PREVIEW
         ========================================================= */}
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
              Workflow Settings
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Define the Starting Status
            </h2>
            <p className="mt-3 text-xl font-semibold leading-relaxed text-slate-600">
              Set the initial workflow condition for this customer record.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Customer Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional internal notes about this customer"
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-700">
            New Customer Preview
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Preview the Starting Record
          </h2>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Customer Name
              </p>
              <p className="mt-2 text-2xl font-extrabold text-blue-900">
                {customerName || "Unnamed Customer"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Contact Person
              </p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-900">
                {contactPerson || "Not provided"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
                Workspace ID Preview
              </p>
              <p className="mt-2 break-all text-2xl font-extrabold text-slate-900">
                {customerPreviewId}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                Initial Status
              </p>
              <p className="mt-2 text-2xl font-extrabold text-violet-900">
                {status}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SAVE ACTIONS
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Save Actions
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Create the Customer Record
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            Save the new customer and either return to the customer list or open
            the new customer workspace immediately.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleSaveCustomer}
            disabled={!isFormValid || submitting}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Customer"}
          </button>

          <button
            type="button"
            onClick={handleSaveAndOpenWorkspace}
            disabled={!isFormValid || submitting}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save and Open Workspace"}
          </button>

          <Link href={`/portal/${transiterId}/customers`}>
            <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}