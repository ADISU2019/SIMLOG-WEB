// app/portal/[transiterId]/customers/[customerId]/edit/page.tsx
// EDIT CUSTOMER WORKSPACE PAGE
// PURPOSE:
// This page updates an existing customer record under one transiter workspace.
//
// WHAT THIS PAGE DOES:
// - loads one existing customer
// - allows the transiter to review and edit customer business information
// - allows updates to contact information and workflow settings
// - saves real changes to Firestore
// - acts as the maintenance page for customer records already created
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / edit purpose
// 2. Business information form
// 3. Contact information form
// 4. Workflow settings
// 5. Updated record preview
// 6. Save actions
//
// ROUTE:
// /portal/[transiterId]/customers/[customerId]/edit

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCustomer } from "../../../../../../hooks/useCustomers";
import {
  updateCustomerRecord,
  type CustomerStatus,
} from "../../../../../lib/customerCrud";

export default function EditCustomerWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const transiterId = String(params?.transiterId || "");
  const customerId = String(params?.customerId || "");

  const {
    customer: rawCustomer,
    loading,
    error,
  } = useCustomer(transiterId, customerId);

  const [customerName, setCustomerName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");

  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<CustomerStatus>("Pending");
  const [internalReference, setInternalReference] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!rawCustomer) return;

    const rawStatus = (rawCustomer.status || "Pending").toString().trim();
    const normalizedStatus: CustomerStatus =
      rawStatus === "Active" ||
      rawStatus === "Pending" ||
      rawStatus === "On Hold"
        ? rawStatus
        : "Pending";

    setCustomerName(rawCustomer.name || "");
    setCompanyType((rawCustomer as any).companyType || "");
    setTin(rawCustomer.tin || "");
    setAddress((rawCustomer as any).address || "");
    setContactPerson(rawCustomer.contactPerson || "");
    setPhone(rawCustomer.phone || "");
    setEmail(rawCustomer.email || "");
    setStatus(normalizedStatus);
    setInternalReference((rawCustomer as any).internalReference || "");
    setNotes((rawCustomer as any).notes || "");
  }, [rawCustomer]);

  const customerPreviewId = useMemo(() => {
    const base = customerName.trim().toLowerCase();
    if (!base) return customerId || "customer";

    return base
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [customerName, customerId]);

  const isFormValid = useMemo(() => {
    return (
      customerName.trim().length > 1 &&
      contactPerson.trim().length > 1 &&
      phone.trim().length > 3
    );
  }, [customerName, contactPerson, phone]);

  const handleSaveChanges = async () => {
    try {
      setSubmitting(true);
      setSaveError("");

      await updateCustomerRecord(transiterId, customerId, {
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

      router.push(`/portal/${transiterId}/customers/${customerId}`);
      router.refresh();
    } catch (saveError) {
      console.error("Error updating customer:", saveError);
      setSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update the customer record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndReturnList = async () => {
    try {
      setSubmitting(true);
      setSaveError("");

      await updateCustomerRecord(transiterId, customerId, {
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
      router.refresh();
    } catch (saveError) {
      console.error("Error updating customer:", saveError);
      setSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update the customer record."
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
              Customer Record Maintenance Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Edit Customer Workspace Record
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              Use this page to review and update an existing customer. Keep the
              record accurate so documents, tax simulation, and declaration
              preparation continue smoothly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Transiter: {transiterId || "transiter"}
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Customer ID: {customerId || "customer"}
              </div>

              <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-amber-700">
                Customer Edit Mode
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers/${customerId}`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Customer Workspace
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/customers`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                Return to Customer List
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
            Review and Update the Customer Identity
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Edit the business identity fields that define this customer record
            in the transiter workflow.
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
            Update the Main Contact Record
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            Keep the main person and communication fields current for this
            customer record.
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
              Update the Customer Status and Notes
            </h2>
            <p className="mt-3 text-xl font-semibold leading-relaxed text-slate-600">
              Adjust the starting workflow status and internal notes for this
              customer.
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
            Updated Record Preview
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Preview the Updated Customer
          </h2>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                Customer Name
              </p>
              <p className="mt-2 text-2xl font-extrabold text-blue-900">
                {loading ? "Loading..." : customerName || "Unnamed Customer"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Contact Person
              </p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-900">
                {loading ? "Loading..." : contactPerson || "Not provided"}
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
                Current Status
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
            Update the Customer Record
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            Save the changes and either return to the customer workspace or go
            back to the customer list.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!isFormValid || submitting || loading}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleSaveAndReturnList}
            disabled={!isFormValid || submitting || loading}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save and Return to List"}
          </button>

          <Link href={`/portal/${transiterId}/customers/${customerId}`}>
            <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}