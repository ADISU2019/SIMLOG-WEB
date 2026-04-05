// app/portal/[transiterId]/customers/[customerId]/tax/page.tsx
// CUSTOMER TAX SIMULATION PAGE
// PURPOSE:
// This page is the tax estimation workspace for one customer record.
//
// WHAT THIS PAGE DOES:
// - shows estimated customs-related charges for one customer
// - organizes tax values into clear financial sections
// - helps the user review duty, VAT, surtax, and total payable estimate
// - acts as the financial review step before declaration preparation
// - shows shared tax reference files used across all transiters and customers
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / tax simulation overview
// 2. Manual tax input panel
// 3. Tax summary tiles
// 4. Tax reference files
// 5. Calculation breakdown
// 6. Assumptions and notes
// 7. Next action guidance
//
// ROUTE:
// /portal/[transiterId]/customers/[customerId]/tax

"use client";

import Link from "next/link";
import { useMemo, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useCustomer } from "../../../../../../hooks/useCustomers";
import { auth, db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type TaxLine = {
  label: string;
  value: string;
  note: string;
  cardClass: string;
  labelClass: string;
  valueClass: string;
};

type StoredReferenceFile = {
  id: string;
  fileName?: string;
  downloadURL?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  status?: "Uploaded" | "Missing" | "Pending Review";
};

type ReferenceFile = {
  id: string;
  title: string;
  subtitle: string;
  status: "Uploaded" | "Missing" | "Pending Review";
  updated: string;
  note: string;
  cardClass: string;
  iconWrap: string;
  badgeClass: string;
  fileName?: string;
  downloadURL?: string;
};

const baseReferenceFiles: ReferenceFile[] = [
  {
    id: "erca-price-list",
    title: "ERCA Price List",
    subtitle: "Indicative valuation reference",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Shared customs valuation reference file used across all transiters and customers during tax review.",
    cardClass: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
    iconWrap: "bg-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  {
    id: "hs-tariff-reference",
    title: "HS / Tariff Reference",
    subtitle: "Classification support file",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Use this shared file for tariff interpretation, customs classification checks, and supporting rate review.",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
    iconWrap: "bg-emerald-600",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  {
    id: "exchange-rate-reference",
    title: "Exchange Rate Reference",
    subtitle: "Currency conversion support",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Use this file to support customs value conversion and exchange-based review during financial estimation.",
    cardClass:
      "border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-100",
    iconWrap: "bg-violet-600",
    badgeClass:
      "bg-violet-100 text-violet-700 border border-violet-200",
  },
  {
    id: "other-tax-support-files",
    title: "Other Tax Support Files",
    subtitle: "Shared reference attachments",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Use for customs circulars, valuation notes, directives, and other shared tax-support documents.",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-100",
    iconWrap: "bg-amber-600",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
  },
];

function formatStoredDate(value?: string) {
  if (!value) return "Updated recently";
  try {
    return `Updated ${new Date(value).toLocaleDateString()}`;
  } catch {
    return "Updated recently";
  }
}

function fmtCurrency(value: number) {
  return `ETB ${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function fmtPercent(value: number) {
  return `${value}%`;
}

function cleanNumericInput(value: string) {
  return value.replace("%", "").trim();
}

export default function CustomerTaxSimulationPage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");
  const customerId = String(params?.customerId || "");

  const {
    customer: rawCustomer,
    loading,
    error,
  } = useCustomer(transiterId, customerId);

  const [storedReferenceFiles, setStoredReferenceFiles] = useState<
    Record<string, StoredReferenceFile>
  >({});
  const [uploadingReferenceId, setUploadingReferenceId] = useState<string | null>(
    null
  );
  const [pageNotice, setPageNotice] = useState("");

  const referenceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [hsCode, setHsCode] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ercaReferencePriceUsd, setErcaReferencePriceUsd] = useState("");
  const [invoiceValueUsd, setInvoiceValueUsd] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [dutyRate, setDutyRate] = useState("10");
  const [vatRate, setVatRate] = useState("15");
  const [surtaxRate, setSurtaxRate] = useState("10");

  const [calculatedValues, setCalculatedValues] = useState({
    customsValueEtb: 125000,
    importDutyEtb: 125000,
    vatEtb: 78500,
    surtaxEtb: 21300,
    totalEtb: 224800,
    workingUsdValue: 0,
  });

  const customer = useMemo(
    () => ({
      id: rawCustomer?.id || customerId || "customer-demo",
      name: rawCustomer?.name || "Unnamed Customer",
      contactPerson: rawCustomer?.contactPerson || "Not provided",
      updatedAt: rawCustomer?.updatedAt
        ? "Recently updated"
        : "No recent update",
    }),
    [rawCustomer, customerId]
  );

  const taxSummary = useMemo<TaxLine[]>(
    () => [
      {
        label: "Import Duty",
        value: fmtCurrency(calculatedValues.importDutyEtb),
        note: "Estimated customs duty based on the current manual input values.",
        cardClass: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
        labelClass: "text-blue-700",
        valueClass: "text-blue-900",
      },
      {
        label: "VAT",
        value: fmtCurrency(calculatedValues.vatEtb),
        note: "Estimated value added tax for this customer shipment.",
        cardClass:
          "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
        labelClass: "text-emerald-700",
        valueClass: "text-emerald-900",
      },
      {
        label: "Surtax",
        value: fmtCurrency(calculatedValues.surtaxEtb),
        note: "Estimated surtax using the current declaration assumptions.",
        cardClass:
          "border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-100",
        labelClass: "text-violet-700",
        valueClass: "text-violet-900",
      },
      {
        label: "Estimated Total",
        value: fmtCurrency(calculatedValues.totalEtb),
        note: "Overall estimated customs-related payable amount.",
        cardClass:
          "border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-100",
        labelClass: "text-amber-700",
        valueClass: "text-amber-900",
      },
    ],
    [calculatedValues]
  );

  useEffect(() => {
    const loadReferenceFiles = async () => {
      try {
        const refCollection = collection(db, "systemReferenceFiles");
        const snap = await getDocs(refCollection);

        const next: Record<string, StoredReferenceFile> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data() as StoredReferenceFile;
          next[docSnap.id] = {
            id: docSnap.id,
            fileName: data.fileName || "",
            downloadURL: data.downloadURL || "",
            uploadedAt: data.uploadedAt || "",
            uploadedBy: data.uploadedBy || "",
            status: data.status || "Uploaded",
          };
        });

        setStoredReferenceFiles(next);
      } catch (err) {
        console.error("Failed to load tax reference files:", err);
      }
    };

    loadReferenceFiles();
  }, []);

  useEffect(() => {
    const loadSavedTaxSimulation = async () => {
      if (!transiterId || !customerId) return;

      try {
        const taxDocRef = doc(
          db,
          "transiters",
          transiterId,
          "customers",
          customerId,
          "taxSimulation",
          "current"
        );

        const snap = await getDoc(taxDocRef);

        if (!snap.exists()) return;

        const data = snap.data();

        setHsCode(data.hsCode || "");
        setItemDescription(data.itemDescription || "");
        setQuantity(String(data.quantity ?? ""));
        setErcaReferencePriceUsd(String(data.ercaReferencePriceUsd ?? ""));
        setInvoiceValueUsd(String(data.invoiceValueUsd ?? ""));
        setExchangeRate(String(data.exchangeRate ?? ""));
        setDutyRate(String(data.dutyRate ?? "10"));
        setVatRate(String(data.vatRate ?? "15"));
        setSurtaxRate(String(data.surtaxRate ?? "10"));

        setCalculatedValues({
          customsValueEtb: Number(data.customsValueEtb ?? 0),
          importDutyEtb: Number(data.importDutyEtb ?? 0),
          vatEtb: Number(data.vatEtb ?? 0),
          surtaxEtb: Number(data.surtaxEtb ?? 0),
          totalEtb: Number(data.totalEtb ?? 0),
          workingUsdValue: Number(data.workingUsdValue ?? 0),
        });
      } catch (err) {
        console.error("Failed to load saved tax simulation:", err);
      }
    };

    loadSavedTaxSimulation();
  }, [transiterId, customerId]);

  const referenceFiles = useMemo<ReferenceFile[]>(() => {
    return baseReferenceFiles.map((item) => {
      const stored = storedReferenceFiles[item.id];
      if (!stored) return item;

      return {
        ...item,
        status: stored.status || "Uploaded",
        updated: formatStoredDate(stored.uploadedAt),
        fileName: stored.fileName,
        downloadURL: stored.downloadURL,
        badgeClass:
          stored.status === "Pending Review"
            ? "bg-amber-100 text-amber-700 border border-amber-200"
            : "bg-emerald-100 text-emerald-700 border border-emerald-200",
      };
    });
  }, [storedReferenceFiles]);

  const calculationBreakdown = useMemo(
    () => [
      {
        title: "Customs Value Basis",
        value: fmtCurrency(calculatedValues.customsValueEtb),
        note: "Working customs value used for tax estimation after converting the selected USD basis into ETB.",
      },
      {
        title: "Duty Rate Assumption",
        value: fmtPercent(Number(cleanNumericInput(dutyRate) || 0)),
        note: "Duty rate currently used in the simulation.",
      },
      {
        title: "VAT Rate Assumption",
        value: fmtPercent(Number(cleanNumericInput(vatRate) || 0)),
        note: "VAT rate currently used in the simulation.",
      },
      {
        title: "Surtax Rate Assumption",
        value: fmtPercent(Number(cleanNumericInput(surtaxRate) || 0)),
        note: "Surtax rate currently used in the simulation.",
      },
    ],
    [calculatedValues.customsValueEtb, dutyRate, vatRate, surtaxRate]
  );

  const notes = useMemo(
    () => [
      "These values are working estimates and should be reviewed before final declaration preparation.",
      "Tax outcomes may change depending on HS code classification, origin, exemptions, and customs treatment.",
      "This page currently supports manual entry so sensitive valuation decisions remain under human review.",
    ],
    []
  );

  const nextActions = useMemo(
    () => [
      "Confirm the supporting documents in the customer document vault.",
      "Review classification and customs assumptions if values appear unusual.",
      "Use the estimate as a reference before building the declaration for CTP.",
      "Continue to declaration preparation once the tax view is acceptable.",
    ],
    []
  );

  const triggerReferencePicker = (referenceId: string) => {
    const input = referenceInputRefs.current[referenceId];
    if (input) input.click();
  };

  const handleReferenceUpload = async (
    referenceFile: ReferenceFile,
    file: File | null
  ) => {
    if (!file) return;

    try {
      setUploadingReferenceId(referenceFile.id);
      setPageNotice("");

      const storagePath = `system-reference-files/tax/${referenceFile.id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const uploadedAt = new Date().toISOString();

      await setDoc(
        doc(db, "systemReferenceFiles", referenceFile.id),
        {
          title: referenceFile.title,
          subtitle: referenceFile.subtitle,
          category: "tax-reference",
          fileName: file.name,
          downloadURL,
          storagePath,
          status: "Uploaded",
          uploadedAt,
          uploadedBy: auth.currentUser?.email || "unknown-user",
          updatedAt: serverTimestamp(),
          isActive: true,
        },
        { merge: true }
      );

      setStoredReferenceFiles((prev) => ({
        ...prev,
        [referenceFile.id]: {
          id: referenceFile.id,
          fileName: file.name,
          downloadURL,
          uploadedAt,
          uploadedBy: auth.currentUser?.email || "unknown-user",
          status: "Uploaded",
        },
      }));

      setPageNotice(`${referenceFile.title} uploaded successfully.`);
    } catch (err) {
      console.error("Failed to upload reference file:", err);
      setPageNotice(`Failed to upload ${referenceFile.title}.`);
    } finally {
      setUploadingReferenceId(null);
    }
  };

  const handleCalculateTax = async () => {
    const parsedQuantity = Number(cleanNumericInput(quantity) || 0);
    const parsedErcaReferencePriceUsd = Number(
      cleanNumericInput(ercaReferencePriceUsd) || 0
    );
    const parsedInvoiceValueUsd = Number(
      cleanNumericInput(invoiceValueUsd) || 0
    );
    const parsedExchangeRate = Number(cleanNumericInput(exchangeRate) || 0);
    const parsedDutyRate = Number(cleanNumericInput(dutyRate) || 0) / 100;
    const parsedVatRate = Number(cleanNumericInput(vatRate) || 0) / 100;
    const parsedSurtaxRate = Number(cleanNumericInput(surtaxRate) || 0) / 100;

    const workingUnitUsd =
      parsedErcaReferencePriceUsd > 0
        ? parsedErcaReferencePriceUsd
        : parsedInvoiceValueUsd;

    const workingUsdValue =
      parsedQuantity > 0 ? workingUnitUsd * parsedQuantity : workingUnitUsd;

    const customsValueEtb = workingUsdValue * parsedExchangeRate;
    const importDutyEtb = customsValueEtb * parsedDutyRate;
    const vatBaseEtb = customsValueEtb + importDutyEtb;
    const vatEtb = vatBaseEtb * parsedVatRate;
    const surtaxEtb = customsValueEtb * parsedSurtaxRate;
    const totalEtb = importDutyEtb + vatEtb + surtaxEtb;

    const nextValues = {
      customsValueEtb,
      importDutyEtb,
      vatEtb,
      surtaxEtb,
      totalEtb,
      workingUsdValue,
    };

    setCalculatedValues(nextValues);

    try {
      const taxDocRef = doc(
        db,
        "transiters",
        transiterId,
        "customers",
        customerId,
        "taxSimulation",
        "current"
      );

      await setDoc(
        taxDocRef,
        {
          hsCode: hsCode.trim(),
          itemDescription: itemDescription.trim(),
          quantity: parsedQuantity,
          ercaReferencePriceUsd: parsedErcaReferencePriceUsd,
          invoiceValueUsd: parsedInvoiceValueUsd,
          exchangeRate: parsedExchangeRate,
          dutyRate: Number(cleanNumericInput(dutyRate) || 0),
          vatRate: Number(cleanNumericInput(vatRate) || 0),
          surtaxRate: Number(cleanNumericInput(surtaxRate) || 0),
          workingUsdValue,
          customsValueEtb,
          importDutyEtb,
          vatEtb,
          surtaxEtb,
          totalEtb,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.email || "unknown-user",
        },
        { merge: true }
      );

      setPageNotice("Tax values calculated and saved successfully.");
    } catch (err) {
      console.error("Failed to save tax simulation:", err);
      setPageNotice("Tax calculated, but failed to save.");
    }
  };

  const handleClearInputs = () => {
    setHsCode("");
    setItemDescription("");
    setQuantity("");
    setErcaReferencePriceUsd("");
    setInvoiceValueUsd("");
    setExchangeRate("");
    setDutyRate("10");
    setVatRate("15");
    setSurtaxRate("10");
    setCalculatedValues({
      customsValueEtb: 125000,
      importDutyEtb: 125000,
      vatEtb: 78500,
      surtaxEtb: 21300,
      totalEtb: 224800,
      workingUsdValue: 0,
    });
    setPageNotice("Manual tax inputs cleared.");
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
              Customer Financial Review Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Customer Tax Simulation
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              This page is the financial estimation workspace for one customer.
              Use it to review customs-related charges before moving into final
              declaration preparation.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                {loading ? "Loading customer..." : customer.name}
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Updated {customer.updatedAt}
              </div>

              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-emerald-700">
                Financial Review Step
              </div>

              <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-amber-700">
                Manual Values
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers/${customerId}`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Customer Workspace
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/customers/${customerId}/documents`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-6 py-3 text-lg font-extrabold text-blue-700 transition hover:bg-blue-100">
                Open Document Vault
              </div>
            </Link>

            <Link href={`/portal/${transiterId}/declarations/demo`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700">
                Continue to Declaration
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

        {pageNotice ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-lg font-semibold leading-relaxed text-emerald-800">
              {pageNotice}
            </p>
          </div>
        ) : null}
      </section>

      {/* =========================================================
          MANUAL TAX INPUT PANEL
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
            Manual Tax Input
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Enter Shipment and Reference Values
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            Use the uploaded ERCA reference document and other customs support
            files to manually enter the correct working values for tax review.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              HS Code
            </label>
            <input
              type="text"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="e.g. 8703"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Item Description
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Enter shipment description"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              ERCA Reference Price (USD)
            </label>
            <input
              type="number"
              value={ercaReferencePriceUsd}
              onChange={(e) => setErcaReferencePriceUsd(e.target.value)}
              placeholder="e.g. 1570"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Invoice Value (USD)
            </label>
            <input
              type="number"
              value={invoiceValueUsd}
              onChange={(e) => setInvoiceValueUsd(e.target.value)}
              placeholder="e.g. 1570"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Exchange Rate (ETB / USD)
            </label>
            <input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="e.g. 154"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Duty Rate (%)
            </label>
            <input
              type="text"
              value={dutyRate}
              onChange={(e) => setDutyRate(cleanNumericInput(e.target.value))}
              placeholder="e.g. 5"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-2 text-sm text-slate-500">
              Enter number only, without % sign.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              VAT Rate (%)
            </label>
            <input
              type="text"
              value={vatRate}
              onChange={(e) => setVatRate(cleanNumericInput(e.target.value))}
              placeholder="e.g. 5"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-2 text-sm text-slate-500">
              Enter number only, without % sign.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
              Surtax Rate (%)
            </label>
            <input
              type="text"
              value={surtaxRate}
              onChange={(e) => setSurtaxRate(cleanNumericInput(e.target.value))}
              placeholder="e.g. 3"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-2 text-sm text-slate-500">
              Enter number only, without % sign.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCalculateTax}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700"
          >
            Calculate Tax
          </button>

          <button
            type="button"
            onClick={handleClearInputs}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50"
          >
            Clear Inputs
          </button>
        </div>
      </section>

      {/* =========================================================
          TAX SUMMARY TILES
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Tax Summary
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Estimated Charges at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These professional summary tiles show the main estimated tax values
            used as a working reference for declaration preparation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {taxSummary.map((item) => (
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
          TAX REFERENCE FILES
         ========================================================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Tax Reference Files
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Shared Reference Documents for Tax Review
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            These files are common across all transiters and customers. Use them
            as shared support documents for customs valuation, classification,
            and tax simulation review.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {referenceFiles.map((item) => (
            <div
              key={item.id}
              className={`rounded-[1.75rem] border p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.cardClass}`}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-md ${item.iconWrap}`}
                >
                  📚
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] ${item.badgeClass}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                {item.subtitle}
              </p>

              <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
                {item.note}
              </p>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                {item.updated}
              </p>

              {item.fileName ? (
                <p className="mt-3 break-all text-sm font-semibold text-slate-700">
                  File: {item.fileName}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No file uploaded yet
                </p>
              )}

              <input
                ref={(el) => {
                  referenceInputRefs.current[item.id] = el;
                }}
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleReferenceUpload(item, e.target.files?.[0] || null)
                }
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => triggerReferencePicker(item.id)}
                  disabled={uploadingReferenceId === item.id}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>
                    {uploadingReferenceId === item.id
                      ? "Uploading..."
                      : "Choose File & Upload"}
                  </span>
                  <span aria-hidden="true">↑</span>
                </button>

                {item.downloadURL ? (
                  <a
                    href={item.downloadURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                  >
                    <span>View Reference</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          CALCULATION BREAKDOWN + NOTES
         ========================================================= */}
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Calculation Breakdown
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Main Assumptions Used in the Estimate
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {calculationBreakdown.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  {item.title}
                </p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-700">
            Financial Notes
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Important Review Notes
          </h2>

          <div className="mt-8 space-y-4">
            {notes.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-extrabold text-amber-700">
                  !
                </div>
                <p className="text-lg font-semibold leading-relaxed text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          NEXT ACTION GUIDE
         ========================================================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Next Action Guide
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Best Order After Reviewing Tax Estimates
          </h2>
          <p className="mt-3 max-w-5xl text-xl font-semibold leading-relaxed text-slate-600">
            Use this guidance to move from tax review into the next stage of the
            customer workflow.
          </p>
        </div>

        <div className="grid gap-5">
          {nextActions.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-extrabold text-white shadow-md">
                {index + 1}
              </div>

              <p className="text-lg font-semibold leading-relaxed text-slate-700">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}