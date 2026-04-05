// app/components/Declaration/DeclarationWizard.tsx
// DECLARATION WIZARD ENGINE
// PURPOSE:
// This component is the core workflow engine for one declaration record.
//
// WHAT THIS COMPONENT DOES:
// - loads one declaration from Firestore in real time
// - hydrates all declaration sections into local working state
// - renders tab-based declaration editing sections
// - controls workflow transitions such as Draft → Verified → Assessed → Submitted
// - supports role-based actions for declarant, finance, and customs officer
// - performs debounced autosave while the declaration is being edited
// - connects the declaration builder to assessment logic and backend status APIs
//
// MAIN TABS IN THIS COMPONENT:
// 1. Header
// 2. Parties
// 3. Transport
// 4. Financial
// 5. Items
// 6. Containers
// 7. Documents
// 8. Assessment
//
// MAIN WORKFLOW ACTIONS:
// 1. Save Draft
// 2. Verify
// 3. Assess
// 4. Submit
// 5. Pay
// 6. Release
// 7. Cancel
//
// FIRESTORE PATH USED HERE:
// transiters/{slug}/declarations/{declarationId}
//
// IMPORTANT NOTES:
// - this component is the declaration production engine of SIMLOG-WEB
// - role loading is still a placeholder and can later be connected to auth/Firestore
// - autosave is guarded so snapshot hydration does not trigger unwanted writes
// - status transitions are validated both locally and through server endpoints

"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import HeaderTab from "./HeaderTab";
import PartiesTab from "./PartiesTab";
import TransportTab from "./TransportTab";
import FinancialTab from "./FinancialTab";
import ItemsTab from "./ItemsTab";
import ContainersTab from "./ContainersTab";
import DocumentsTab from "./DocumentsTab";
import AssessmentNotice from "./AssessmentNotice";

import { DeclarationStatus } from "@/types/declarationStatus";
import {
  Declaration,
  DeclarationItem,
  DeclarationHeader,
  DeclarationParties,
  DeclarationTransport,
  DeclarationFinancial,
} from "@/types/declaration";

import { calculateTotals } from "@/lib/assessmentEngine";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useDebouncedEffect } from "@/lib/useDebouncedEffect";

const tabs = [
  "Header",
  "Parties",
  "Transport",
  "Financial",
  "Items",
  "Containers",
  "Documents",
  "Assessment",
] as const;

const allowedTransitions: Record<DeclarationStatus, DeclarationStatus[]> = {
  [DeclarationStatus.DRAFT]: [
    DeclarationStatus.VERIFIED,
    DeclarationStatus.CANCELLED,
  ],
  [DeclarationStatus.VERIFIED]: [
    DeclarationStatus.ASSESSED,
    DeclarationStatus.CANCELLED,
  ],
  [DeclarationStatus.ASSESSED]: [DeclarationStatus.SUBMITTED],
  [DeclarationStatus.SUBMITTED]: [
    DeclarationStatus.PAID,
    DeclarationStatus.CANCELLED,
  ],
  [DeclarationStatus.PAID]: [DeclarationStatus.RELEASED],
  [DeclarationStatus.RELEASED]: [],
  [DeclarationStatus.CANCELLED]: [],
};

type Props = {
  slug: string;
  declarationId: string;
  readOnly?: boolean;
};

export default function DeclarationWizard({
  slug,
  declarationId,
  readOnly = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("Header");
  const [status, setStatus] = useState<DeclarationStatus>(
    DeclarationStatus.DRAFT
  );

  // Role-based visibility (placeholder for now)
  const [role, setRole] = useState<"declarant" | "finance" | "officer">(
    "declarant"
  );

  useEffect(() => {
    // TODO: fetch role from auth / Firestore later
    // setRole(...)
  }, []);

  const [header, setHeader] = useState<DeclarationHeader>({});
  const [parties, setParties] = useState<DeclarationParties>({});
  const [transport, setTransport] = useState<DeclarationTransport>({});
  const [financial, setFinancial] = useState<DeclarationFinancial>({});
  const [items, setItems] = useState<DeclarationItem[]>([]);
  const [totals, setTotals] = useState({
    cif: 0,
    duty: 0,
    vat: 0,
    excise: 0,
    grandTotal: 0,
  });

  const [docExists, setDocExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // Prevent autosave triggered by snapshot hydration
  const isHydratingRef = useRef(true);

  const hasValidIdentity = Boolean(slug && declarationId);

  const declRef = useMemo(() => {
    if (!hasValidIdentity) return null;
    return doc(db, "transiters", slug, "declarations", declarationId);
  }, [slug, declarationId, hasValidIdentity]);

  // ========================
  // LOAD EXISTING DECLARATION
  // ========================
  useEffect(() => {
    if (!hasValidIdentity || !declRef) {
      setLoading(false);
      setDocExists(false);
      return;
    }

    const unsub = onSnapshot(
      declRef,
      (snap) => {
        setLoading(false);

        if (!snap.exists()) {
          setDocExists(false);
          isHydratingRef.current = false;
          return;
        }

        setDocExists(true);

        // Hydration guard: don’t autosave while applying snapshot data
        isHydratingRef.current = true;

        const data = snap.data() as any;

        setHeader(data.header || {});
        setParties(data.parties || {});
        setTransport(data.transport || {});
        setFinancial(data.financial || {});
        setItems(data.items || []);
        setTotals(
          data.totals || {
            cif: 0,
            duty: 0,
            vat: 0,
            excise: 0,
            grandTotal: 0,
          }
        );
        setStatus(
          (data.status as DeclarationStatus) || DeclarationStatus.DRAFT
        );

        queueMicrotask(() => {
          isHydratingRef.current = false;
        });
      },
      (err) => {
        setLoading(false);
        console.error("Failed to load declaration:", err);
      }
    );

    return () => unsub();
  }, [hasValidIdentity, declRef]);

  // ========================
  // ROLE/STATUS BASED FORM LOCKING
  // ========================
  const canEditForm =
    !readOnly &&
    role === "declarant" &&
    (status === DeclarationStatus.DRAFT ||
      status === DeclarationStatus.VERIFIED);

  const formReadOnly = !canEditForm;

  // ========================
  // API HELPERS
  // ========================
  const saveBase = async (next: Partial<Declaration>) => {
    if (readOnly) return;
    if (!hasValidIdentity) {
      throw new Error("Missing declaration identity.");
    }

    const payload: Partial<Declaration> = {
      id: declarationId,
      header,
      parties,
      transport,
      financial,
      items,
      totals,
      ...next,
    };

    const res = await fetch(
      `/api/portal/${slug}/declarations/${declarationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Save failed");
    }
  };

  const callStatus = async (
    toStatus: DeclarationStatus,
    meta?: Record<string, any>
  ) => {
    if (!hasValidIdentity) {
      throw new Error("Missing declaration identity.");
    }

    const res = await fetch(
      `/api/portal/${slug}/declarations/${declarationId}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus,
          role,
          actorUid: auth.currentUser?.uid || "unknown",
          meta: meta || {},
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Status change failed");
    }
  };

  // ========================
  // AUTO-SAVE (DEBOUNCED)
  // ========================
  useDebouncedEffect(
    async () => {
      if (readOnly) return;
      if (!hasValidIdentity) return;
      if (loading) return;
      if (formReadOnly) return;
      if (isHydratingRef.current) return;
      if (!docExists) return;

      try {
        await saveBase({});
      } catch (e) {
        console.error("Autosave failed:", e);
      }
    },
    [
      header,
      parties,
      transport,
      financial,
      items,
      totals,
      loading,
      formReadOnly,
      hasValidIdentity,
      docExists,
      readOnly,
    ],
    800
  );

  // ========================
  // WORKFLOW HELPERS
  // ========================
  const updateStatusLocal = (nextStatus: DeclarationStatus) => {
    if (!allowedTransitions[status].includes(nextStatus)) {
      alert(`Invalid workflow transition: ${status} → ${nextStatus}`);
      return;
    }
    setStatus(nextStatus);
  };

  // ========================
  // WORKFLOW HANDLERS (SERVER-SIDE)
  // ========================
  const handleSaveDraft = async () => {
    try {
      await saveBase({ status: DeclarationStatus.DRAFT });
      setStatus(DeclarationStatus.DRAFT);
      alert("Draft saved ✅");
    } catch (error) {
      console.error(error);
      alert("Failed to save draft");
    }
  };

  const handleVerify = async () => {
    try {
      if (readOnly) return;
      await callStatus(DeclarationStatus.VERIFIED);
      updateStatusLocal(DeclarationStatus.VERIFIED);
      alert("Verified ✅");
    } catch (error) {
      console.error(error);
      alert("Verification failed");
    }
  };

  const handleAssess = async () => {
    if (items.length === 0) return alert("Add at least one item");

    const calculatedTotals = calculateTotals(items, 1);
    setTotals(calculatedTotals);

    try {
      if (readOnly) return;

      // Persist totals first so server has the latest values
      await saveBase({ totals: calculatedTotals });

      await callStatus(DeclarationStatus.ASSESSED, {
        itemsCount: items.length,
        totals: calculatedTotals,
      });

      updateStatusLocal(DeclarationStatus.ASSESSED);
      alert("Assessment complete ✅");
    } catch (error) {
      console.error(error);
      alert("Assessment failed");
    }
  };

  const handleSubmit = async () => {
    if (status !== DeclarationStatus.ASSESSED) {
      return alert("Declaration must be ASSESSED before submission");
    }

    try {
      if (readOnly) return;
      await callStatus(DeclarationStatus.SUBMITTED);
      updateStatusLocal(DeclarationStatus.SUBMITTED);
      alert("Submitted ✅");
    } catch (error) {
      console.error(error);
      alert("Submit failed");
    }
  };

  const handlePayment = async () => {
    if (status !== DeclarationStatus.SUBMITTED) {
      return alert("Declaration must be SUBMITTED before payment");
    }

    try {
      if (readOnly) return;

      const paymentReference = `PAY-${Date.now()}`;

      // Save payment reference so it exists on the declaration doc
      await saveBase({ paymentReference } as any);

      await callStatus(DeclarationStatus.PAID, { paymentReference });

      updateStatusLocal(DeclarationStatus.PAID);
      alert("Payment successful 💳");
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }
  };

  const handleRelease = async () => {
    if (status !== DeclarationStatus.PAID) {
      return alert("Declaration must be PAID before release");
    }

    try {
      if (readOnly) return;
      await callStatus(DeclarationStatus.RELEASED);
      updateStatusLocal(DeclarationStatus.RELEASED);
      alert("Released 🟢");
    } catch (error) {
      console.error(error);
      alert("Release failed");
    }
  };

  const handleCancel = async () => {
    const cancellable = [
      DeclarationStatus.DRAFT,
      DeclarationStatus.VERIFIED,
      DeclarationStatus.SUBMITTED,
    ] as const;

    if (!cancellable.includes(status as any)) {
      return alert(
        "Only DRAFT, VERIFIED, or SUBMITTED declarations can be cancelled."
      );
    }

    const ok = window.confirm("Cancel this declaration? This cannot be undone.");
    if (!ok) return;

    try {
      if (readOnly) return;
      await callStatus(DeclarationStatus.CANCELLED);
      updateStatusLocal(DeclarationStatus.CANCELLED);
      alert("Cancelled ✅");
    } catch (error) {
      console.error(error);
      alert("Cancel failed");
    }
  };

  // ========================
  // RENDER TAB (pass readOnly)
  // ========================
  const renderTab = () => {
    switch (activeTab) {
      case "Header":
        return (
          <HeaderTab
            header={header}
            setHeader={setHeader}
            readOnly={formReadOnly}
          />
        );

      case "Parties":
        return (
          <PartiesTab
            parties={parties}
            setParties={setParties}
            readOnly={formReadOnly}
          />
        );

      case "Transport":
        return (
          <TransportTab
            transport={transport}
            setTransport={setTransport}
            readOnly={formReadOnly}
          />
        );

      case "Financial":
        return (
          <FinancialTab
            financial={financial}
            setFinancial={setFinancial}
            readOnly={formReadOnly}
          />
        );

      case "Items":
        return (
          <ItemsTab
            items={items}
            setItems={setItems}
            readOnly={formReadOnly}
          />
        );

      case "Containers":
        return <ContainersTab readOnly={formReadOnly} />;

      case "Documents":
        return <DocumentsTab readOnly={formReadOnly} />;

      case "Assessment":
        return <AssessmentNotice totals={totals} />;

      default:
        return null;
    }
  };

  // ========================
  // RENDER WORKFLOW BUTTONS WITH ROLE CHECK
  // ========================
  const renderWorkflowButtons = () => (
    <div className="flex flex-wrap gap-2">
      {role === "declarant" && (
        <>
          <button
            className="rounded bg-gray-300 px-4 py-2"
            disabled={
              readOnly ||
              loading ||
              !hasValidIdentity ||
              status !== DeclarationStatus.DRAFT
            }
            onClick={handleSaveDraft}
          >
            Save Draft
          </button>

          <button
            className="rounded bg-yellow-400 px-4 py-2"
            disabled={
              readOnly ||
              loading ||
              !hasValidIdentity ||
              status !== DeclarationStatus.DRAFT
            }
            onClick={handleVerify}
          >
            Verify
          </button>

          <button
            className="rounded bg-green-500 px-4 py-2 text-white"
            disabled={
              readOnly ||
              loading ||
              !hasValidIdentity ||
              status !== DeclarationStatus.VERIFIED
            }
            onClick={handleAssess}
          >
            Assess
          </button>

          <button
            className="rounded bg-blue-500 px-4 py-2 text-white"
            disabled={
              readOnly ||
              loading ||
              !hasValidIdentity ||
              status !== DeclarationStatus.ASSESSED
            }
            onClick={handleSubmit}
          >
            Submit
          </button>

          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            disabled={
              readOnly ||
              loading ||
              !hasValidIdentity ||
              ![
                DeclarationStatus.DRAFT,
                DeclarationStatus.VERIFIED,
                DeclarationStatus.SUBMITTED,
              ].includes(status)
            }
            onClick={handleCancel}
          >
            Cancel
          </button>
        </>
      )}

      {role === "finance" && (
        <button
          className="rounded bg-purple-600 px-4 py-2 text-white"
          disabled={
            readOnly ||
            loading ||
            !hasValidIdentity ||
            status !== DeclarationStatus.SUBMITTED
          }
          onClick={handlePayment}
        >
          Pay
        </button>
      )}

      {role === "officer" && (
        <button
          className="rounded bg-green-700 px-4 py-2 text-white"
          disabled={
            readOnly ||
            loading ||
            !hasValidIdentity ||
            status !== DeclarationStatus.PAID
          }
          onClick={handleRelease}
        >
          Release
        </button>
      )}
    </div>
  );

  if (!hasValidIdentity) {
    return (
      <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
        <h3 className="text-xl font-extrabold text-rose-900">
          Missing Declaration Identity
        </h3>
        <p className="mt-2 text-base font-semibold leading-relaxed text-rose-700">
          The declaration wizard cannot load because the transiter ID or
          declaration ID is missing.
        </p>
      </div>
    );
  }

  return (
    <div className="declaration-wizard p-4">
      <nav className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded px-3 py-1 ${
              tab === activeTab ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
            disabled={loading}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mb-4 border p-4">{loading ? "Loading…" : renderTab()}</div>

      {renderWorkflowButtons()}

      <div className="mt-4">
        <strong>Status:</strong> {status}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Path: transiters/{slug}/declarations/{declarationId}{" "}
        {!loading && !docExists ? "(not found yet)" : ""}{" "}
        {formReadOnly ? "(read-only)" : ""}
      </div>
    </div>
  );
}