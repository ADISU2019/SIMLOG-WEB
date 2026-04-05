// app/portal/[transiterId]/customers/[customerId]/documents/page.tsx
// CUSTOMER DOCUMENT VAULT PAGE
// PURPOSE:
// This page is the main document workspace for one customer record.
//
// WHAT THIS PAGE DOES:
// - shows the customer document vault for one customer
// - organizes key customs and shipment documents into clear categories
// - shows upload readiness for declaration preparation
// - gives one place to review, upload, and track document completeness
// - allows direct upload from each document card
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Page identity / customer document overview
// 2. Document readiness summary
// 3. Required document tiles
// 4. Recent uploads
// 5. Next action guidance
//
// ROUTE:
// /portal/[transiterId]/customers/[customerId]/documents

"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useCustomer } from "../../../../../../hooks/useCustomers";
import { db, storage, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

type DocumentStatus = "Uploaded" | "Missing" | "Pending Review";

type StoredDocument = {
  id: string;
  fileName?: string;
  downloadURL?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  status?: DocumentStatus;
};

type DocumentTile = {
  id: string;
  title: string;
  subtitle: string;
  status: DocumentStatus;
  updated: string;
  note: string;
  cardClass: string;
  iconWrap: string;
  badgeClass: string;
  fileName?: string;
  downloadURL?: string;
};

const baseDocumentTiles: DocumentTile[] = [
  {
    id: "commercial-invoice",
    title: "Commercial Invoice",
    subtitle: "Primary customs value document",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Required for declaration value and transaction reference.",
    cardClass: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100",
    iconWrap: "bg-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  {
    id: "packing-list",
    title: "Packing List",
    subtitle: "Shipment content breakdown",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Used to verify package structure and item grouping.",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100",
    iconWrap: "bg-emerald-600",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  {
    id: "bill-of-lading",
    title: "Bill of Lading",
    subtitle: "Transport ownership document",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Check transport details before final declaration preparation.",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-100",
    iconWrap: "bg-amber-600",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  {
    id: "certificate-of-origin",
    title: "Certificate of Origin",
    subtitle: "Origin verification document",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Needed where origin confirmation affects customs treatment.",
    cardClass:
      "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100",
    iconWrap: "bg-slate-600",
    badgeClass: "bg-slate-200 text-slate-700 border border-slate-300",
  },
  {
    id: "insurance-document",
    title: "Insurance Document",
    subtitle: "Cargo insurance support file",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Attach if insurance value or coverage must be declared.",
    cardClass:
      "border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-100",
    iconWrap: "bg-violet-600",
    badgeClass:
      "bg-violet-100 text-violet-700 border border-violet-200",
  },
  {
    id: "other-attachments",
    title: "Additional Attachments",
    subtitle: "Other supporting files",
    status: "Missing",
    updated: "Not uploaded yet",
    note: "Use for licenses, permits, correspondence, and supporting notes.",
    cardClass: "border-cyan-100 bg-gradient-to-br from-cyan-50 to-teal-100",
    iconWrap: "bg-cyan-600",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
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

export default function CustomerDocumentVaultPage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");
  const customerId = String(params?.customerId || "");

  const {
    customer: rawCustomer,
    loading,
    error,
  } = useCustomer(transiterId, customerId);

  const [storedDocs, setStoredDocs] = useState<Record<string, StoredDocument>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const customer = useMemo(
    () => ({
      id: rawCustomer?.id || customerId || "customer-demo",
      name: rawCustomer?.name || "Unnamed Customer",
      contactPerson: rawCustomer?.contactPerson || "Not provided",
      status: rawCustomer?.status || "Pending",
      documents: Number(rawCustomer?.documents ?? 0),
      updatedAt: rawCustomer?.updatedAt ? "Recently updated" : "No recent update",
    }),
    [rawCustomer, customerId]
  );

  useEffect(() => {
    const loadStoredDocuments = async () => {
      if (!transiterId || !customerId) return;

      try {
        setLoadingDocs(true);

        const docsRef = collection(
          db,
          "transiters",
          transiterId,
          "customers",
          customerId,
          "documents"
        );

        const snap = await getDocs(docsRef);
        const next: Record<string, StoredDocument> = {};

        snap.forEach((docSnap) => {
          const data = docSnap.data() as StoredDocument;
          next[docSnap.id] = {
            id: docSnap.id,
            fileName: data.fileName || "",
            downloadURL: data.downloadURL || "",
            uploadedAt: data.uploadedAt || "",
            uploadedBy: data.uploadedBy || "",
            status: data.status || "Uploaded",
          };
        });

        setStoredDocs(next);
      } catch (err) {
        console.error("Failed to load stored documents:", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    loadStoredDocuments();
  }, [transiterId, customerId]);

  const documentTiles = useMemo<DocumentTile[]>(() => {
    return baseDocumentTiles.map((doc) => {
      const stored = storedDocs[doc.id];

      if (!stored) return doc;

      return {
        ...doc,
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
  }, [storedDocs]);

  const readiness = useMemo(() => {
    const uploadedCount = documentTiles.filter(
      (doc) => doc.status === "Uploaded"
    ).length;
    const totalCount = documentTiles.length;
    const percent = Math.round((uploadedCount / totalCount) * 100);

    return {
      uploadedCount,
      totalCount,
      percent,
    };
  }, [documentTiles]);

  const recentUploads = useMemo(() => {
    const uploaded = documentTiles
      .filter((doc) => doc.status === "Uploaded")
      .slice(0, 3)
      .map((doc) => ({
        title: doc.title,
        time: doc.updated,
        note: doc.fileName
          ? `${doc.fileName} uploaded and stored in the customer vault.`
          : "Uploaded and available for declaration review.",
      }));

    return uploaded.length > 0
      ? uploaded
      : [
          {
            title: "No uploads yet",
            time: "Waiting",
            note: "Upload a document from any card to start document tracking.",
          },
        ];
  }, [documentTiles]);

  const nextActions = useMemo(
    () => [
      "Upload any missing required customs documents.",
      "Review pending files before moving into declaration preparation.",
      "Use the customer vault as the source of truth for document readiness.",
      "Continue to declaration workspace once the required set is complete.",
    ],
    []
  );

  const triggerFilePicker = (docId: string) => {
    const input = fileInputRefs.current[docId];
    if (input) input.click();
  };

  const handleDirectUpload = async (
    documentType: DocumentTile,
    file: File | null
  ) => {
    if (!file || !transiterId || !customerId) return;

    try {
      setUploadingDocId(documentType.id);
      setPageNotice("");

      const storagePath = `transiters/${transiterId}/customers/${customerId}/documents/${documentType.id}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const uploadedAt = new Date().toISOString();

      await setDoc(
        doc(
          db,
          "transiters",
          transiterId,
          "customers",
          customerId,
          "documents",
          documentType.id
        ),
        {
          documentType: documentType.id,
          title: documentType.title,
          fileName: file.name,
          downloadURL,
          storagePath,
          customerId,
          transiterId,
          status: "Uploaded",
          uploadedAt,
          uploadedBy: auth.currentUser?.email || "unknown-user",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStoredDocs((prev) => ({
        ...prev,
        [documentType.id]: {
          id: documentType.id,
          fileName: file.name,
          downloadURL,
          uploadedAt,
          uploadedBy: auth.currentUser?.email || "unknown-user",
          status: "Uploaded",
        },
      }));

      setPageNotice(`${documentType.title} uploaded successfully.`);
    } catch (err) {
      console.error("Upload failed:", err);
      setPageNotice(`Failed to upload ${documentType.title}.`);
    } finally {
      setUploadingDocId(null);
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
              Customer Document Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Customer Document Vault
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              This page is the document workspace for one customer. Use it to
              review required files, track upload readiness, and prepare the
              document set needed for declaration work.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                {loading ? "Loading customer..." : customer.name}
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-slate-700">
                Updated {customer.updatedAt}
              </div>

              <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">
                {readiness.uploadedCount}/{readiness.totalCount} Required Files Ready
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/portal/${transiterId}/customers/${customerId}`}>
              <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50">
                Back to Customer Workspace
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

      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Document Readiness
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Upload Progress at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            This section shows how complete the customer document vault is before
            tax and declaration work continues.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                Declaration Readiness
              </p>
              <p className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
                {readiness.percent}%
              </p>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-600">
                {readiness.uploadedCount} of {readiness.totalCount} tracked
                document categories are ready.
              </p>
            </div>

            <div className="w-full max-w-2xl">
              <div className="h-6 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${readiness.percent}%` }}
                />
              </div>
              <p className="mt-3 text-base font-semibold text-slate-500">
                Move to declaration preparation when the required documents are complete.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Required and Supporting Files
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Review the Customer Document Set
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These professional tiles organize the main document categories used
            in customs preparation and declaration support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {documentTiles.map((docTile) => (
            <div
              key={docTile.id}
              className={`rounded-[1.75rem] border p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${docTile.cardClass}`}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white shadow-md ${docTile.iconWrap}`}
                >
                  📄
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] ${docTile.badgeClass}`}
                >
                  {docTile.status}
                </span>
              </div>

              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">
                {docTile.subtitle}
              </p>

              <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
                {docTile.title}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
                {docTile.note}
              </p>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                {docTile.updated}
              </p>

              {docTile.fileName ? (
                <p className="mt-3 break-all text-sm font-semibold text-slate-700">
                  File: {docTile.fileName}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No file uploaded yet
                </p>
              )}

              <input
                ref={(el) => {
                  fileInputRefs.current[docTile.id] = el;
                }}
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleDirectUpload(docTile, e.target.files?.[0] || null)
                }
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => triggerFilePicker(docTile.id)}
                  disabled={uploadingDocId === docTile.id}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>
                    {uploadingDocId === docTile.id ? "Uploading..." : "Choose File & Upload"}
                  </span>
                  <span aria-hidden="true">↑</span>
                </button>

                {docTile.downloadURL ? (
                  <a
                    href={docTile.downloadURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100"
                  >
                    <span>View File</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-700">
            Recent Upload Activity
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Latest Vault Updates
          </h2>

          <div className="mt-8 space-y-4">
            {recentUploads.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-extrabold text-blue-700">
                    ✓
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                      {item.time}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-700">
                      {item.note}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Next Action Guide
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            What to Do Next
          </h2>

          <div className="mt-8 space-y-4">
            {nextActions.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-extrabold text-white">
                  {index + 1}
                </div>
                <p className="text-lg font-semibold leading-relaxed text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-lg font-semibold leading-relaxed text-emerald-900">
              The document vault should become the source of truth before moving
              into structured declaration work.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}