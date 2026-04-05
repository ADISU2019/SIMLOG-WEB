// FANTAYE PLATFORMS
// Phase 3B – Shipment Detail Page
// Version: v3.9.0
// Date: 2026-02-18

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import DocumentUpload from "@/components/DocumentUpload";
import { ShipmentStatus } from "@/types/declarationStatus";

/* ================================
   Shipment Type
   ================================ */
type Shipment = {
  id: string;
  customerName: string;
  hsCode: string;
  cif: number;
  originCountry: string;
  status: ShipmentStatus;
  customsDuty?: number;
  vat?: number;
  totalTax?: number;
  exchangeRate?: number;
  [key: string]: any;
};

/* ================================
   Status Badge
   ================================ */
const STATUS_STYLES: Record<ShipmentStatus, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  DOCUMENTS_UPLOADED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  CLEARED: "bg-teal-100 text-teal-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

/* ================================
   Tax Simulator
   ================================ */
function ShipmentTaxSimulator({
  shipmentId,
  cif,
  exchangeRate,
  updateShipment,
}: {
  shipmentId: string;
  cif: number;
  exchangeRate: number;
  updateShipment: (data: Partial<Shipment>) => void;
}) {
  const [cifValue, setCifValue] = useState<number>(cif || 0);
  const [rate, setRate] = useState<number>(exchangeRate || 1);
  const [taxSummary, setTaxSummary] = useState({
    customsDuty: 0,
    vat: 0,
    totalTax: 0,
  });

  const simulateTax = async () => {
    const customsDuty = cifValue * 0.3;
    const vat = (cifValue + customsDuty) * 0.15;
    const totalTax = customsDuty + vat;

    setTaxSummary({ customsDuty, vat, totalTax });
    await updateShipment({ customsDuty, vat, totalTax });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Tax Simulator</h2>

      <input
        type="number"
        className="border p-2 w-full mb-2"
        placeholder="CIF Value"
        value={cifValue}
        onChange={(e) => setCifValue(Number(e.target.value))}
      />

      <input
        type="number"
        className="border p-2 w-full mb-4"
        placeholder="Exchange Rate"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
      />

      <button
        className="bg-green-600 text-white px-6 py-2 rounded"
        onClick={simulateTax}
      >
        Calculate Tax
      </button>

      <div className="mt-4 text-gray-700">
        <p>
          <strong>Customs Duty:</strong> {taxSummary.customsDuty.toFixed(2)}
        </p>
        <p>
          <strong>VAT:</strong> {taxSummary.vat.toFixed(2)}
        </p>
        <p>
          <strong>Total Tax:</strong> {taxSummary.totalTax.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

/* ================================
   Shipment Detail Page
   ================================ */
export default function ShipmentDetailPage() {
  const params = useParams() as { id?: string };
  const id = params.id;

  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      if (!id) return;
      const shipmentRef = doc(db, "shipments", id);
      const snap = await getDoc(shipmentRef);
      if (snap.exists()) {
        setShipment({ id: snap.id, ...snap.data() } as Shipment);
      }
    };
    fetchShipment();
  }, [id]);

  // ✅ Type-safe update of shipment in Firestore and state
  const updateShipmentInFirestore = async (data: Partial<Shipment>) => {
    if (!shipment || !id) return;

    const shipmentRef = doc(db, "shipments", id);
    await updateDoc(shipmentRef, data);

    setShipment((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        ...data,
        status: data.status ?? prev.status, // ensure status is always present
      };
    });
  };

  if (!id) return <div className="p-10">Invalid shipment ID</div>;
  if (!shipment) return <div className="p-10">Loading shipment...</div>;

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shipment File</h1>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-1">
        <p>
          <strong>Customer:</strong> {shipment.customerName}
        </p>
        <p>
          <strong>HS Code:</strong> {shipment.hsCode}
        </p>
        <p>
          <strong>CIF Value:</strong> {shipment.cif}
        </p>
        <p>
          <strong>Origin:</strong> {shipment.originCountry}
        </p>
        <p>
          <strong>Status (raw):</strong>{" "}
          <span className="text-blue-700">{shipment.status}</span>
        </p>
      </div>

      {/* ================================
          Document Upload (auto-update status)
          ================================ */}
      <DocumentUpload
        shipmentId={shipment.id}
        onUploadSuccess={() => {
          if (shipment.status !== "DOCUMENTS_UPLOADED") {
            updateShipmentInFirestore({
              status: "DOCUMENTS_UPLOADED" as ShipmentStatus,
            });
          }
        }}
      />

      {/* ================================
          Tax Simulator
          ================================ */}
      <ShipmentTaxSimulator
        shipmentId={shipment.id}
        cif={shipment.cif}
        exchangeRate={shipment.exchangeRate || 1}
        updateShipment={updateShipmentInFirestore}
      />
    </div>
  );
}