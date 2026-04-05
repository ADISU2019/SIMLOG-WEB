"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * FIRESTORE:
 * companies/{companyId}/payments
 *
 * STORAGE:
 * receipts/{companyId}/file.jpg
 */

type Payment = {
  id: string;
  tripCode: string;
  driverName: string;
  truckPlate: string;
  amount: string;
  method: string;
  cashierName: string;
  note: string;
  receipt: string;
  status: "Submitted" | "Verified" | "Rejected";
  submittedAt?: any;
};

export default function PaymentsPage() {
  const params = useParams();
  const companyId = String(params?.companyId || "");

  const [payments, setPayments] = useState<Payment[]>([]);

  // ===== FORM STATE =====
  const [tripCode, setTripCode] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [cashierName, setCashierName] = useState("");
  const [note, setNote] = useState("");

  // 🔥 NEW
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ===== LOAD PAYMENTS =====
  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, "companies", companyId, "payments"),
      orderBy("submittedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Payment, "id">),
      }));
      setPayments(data);
    });

    return () => unsubscribe();
  }, [companyId]);

  // ===== SUBMIT PAYMENT =====
  const handleSubmit = async () => {
    if (!tripCode || !amount) {
      alert("Trip Code and Amount are required");
      return;
    }

    try {
      setUploading(true);

      let receiptUrl = "";

      // ===== UPLOAD IMAGE =====
      if (receiptFile) {
        const storage = getStorage();

        const fileRef = ref(
          storage,
          `receipts/${companyId}/${Date.now()}-${receiptFile.name}`
        );

        await uploadBytes(fileRef, receiptFile);

        receiptUrl = await getDownloadURL(fileRef);
      }

      // ===== SAVE TO FIRESTORE =====
      await addDoc(
        collection(db, "companies", companyId, "payments"),
        {
          tripCode,
          driverName,
          truckPlate,
          amount,
          method,
          cashierName,
          note,
          receipt: receiptUrl,
          status: "Submitted",
          submittedAt: serverTimestamp(),
        }
      );

      // ===== RESET FORM =====
      setTripCode("");
      setDriverName("");
      setTruckPlate("");
      setAmount("");
      setMethod("Cash");
      setCashierName("");
      setNote("");
      setReceiptFile(null);

    } catch (err) {
      console.error(err);
      alert("Failed to submit payment");
    } finally {
      setUploading(false);
    }
  };

  // ===== UPDATE STATUS =====
  const updateStatus = async (id: string, status: Payment["status"]) => {
    try {
      await updateDoc(
        doc(db, "companies", companyId, "payments", id),
        { status }
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* ===== HEADER ===== */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-3xl font-extrabold">Payments</h1>
          <p className="text-slate-600">Cashier + Dispatcher shared system</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Stat label="Total" value={payments.length} />
            <Stat label="Submitted" value={payments.filter(p => p.status === "Submitted").length} />
            <Stat label="Verified" value={payments.filter(p => p.status === "Verified").length} />
            <Stat label="Rejected" value={payments.filter(p => p.status === "Rejected").length} />
          </div>
        </section>

        {/* ===== FORM ===== */}
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-extrabold">New Payment</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Trip Code" value={tripCode} setValue={setTripCode} />
            <Input label="Driver Name" value={driverName} setValue={setDriverName} />
            <Input label="Truck Plate" value={truckPlate} setValue={setTruckPlate} />
            <Input label="Amount" value={amount} setValue={setAmount} />

            <select
              className="border p-3 rounded"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>Cash</option>
              <option>Bank</option>
              <option>Transfer</option>
            </select>

            <Input label="Cashier Name" value={cashierName} setValue={setCashierName} />
          </div>

          <Input label="Note" value={note} setValue={setNote} />

          {/* ===== RECEIPT UPLOAD ===== */}
          <div>
            <p className="text-sm font-bold mb-1">Upload Receipt</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setReceiptFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold"
          >
            {uploading ? "Uploading..." : "Submit Payment"}
          </button>
        </section>

        {/* ===== LIST ===== */}
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-extrabold">Payments</h2>

          {payments.length === 0 ? (
            <p>No payments yet</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="border p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <p className="font-bold">{p.tripCode}</p>
                  <Status status={p.status} />
                </div>

                <p>{p.driverName} • {p.truckPlate}</p>
                <p>Amount: {p.amount}</p>
                <p>Cashier: {p.cashierName}</p>

                {/* ===== RECEIPT VIEW ===== */}
                {p.receipt && (
                  <img
                    src={p.receipt}
                    alt="receipt"
                    className="mt-2 w-40 rounded border"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(p.id, "Verified")}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Verify
                  </button>

                  <button
                    onClick={() => updateStatus(p.id, "Rejected")}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

      </div>
    </main>
  );
}

/* ===== SMALL COMPONENTS ===== */

function Input({ label, value, setValue }: any) {
  return (
    <input
      placeholder={label}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="border p-3 rounded"
    />
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="bg-slate-100 p-3 rounded">
      <p className="text-sm">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Status({ status }: any) {
  const color =
    status === "Verified"
      ? "text-green-600"
      : status === "Rejected"
      ? "text-red-600"
      : "text-yellow-600";

  return <span className={`font-bold ${color}`}>{status}</span>;
}