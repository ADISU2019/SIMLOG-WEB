//app/portal/tracking/[companyId]/tracking/cashier/page.tsx

"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

type PaymentMethod = "cash" | "bank" | "mobile" | "credit";
type PaymentStatus = "pending_cashier" | "paid" | "partial" | "rejected";

type Trip = {
  id: string;
  status?: string;
  assignedAt?: string;
  tripCode?: string;
  tripType?: string;
  startCity?: string;
  destinationCity?: string;
  truckPlate?: string;
  driverName?: string;
  loadType?: string;
  agreedCost?: number;
  ownerName?: string;
  ownerPhone?: string;
  ownerTelegramChatId?: string;
  payment?: {
    method?: PaymentMethod;
    status?: PaymentStatus;
    expectedAmount?: number;
    paidAmount?: number;
    balance?: number;
    currency?: "ETB";
    receiptNumber?: string;
    receiptUrl?: string;
    receiptPath?: string;
    referenceNumber?: string;
    acceptedBy?: string;
    acceptedAt?: string | null;
    note?: string;
  };
};

export default function CashierPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId: rawCompanyId } = React.use(params);
  const companyId = useMemo(
    () => String(rawCompanyId ?? "").trim(),
    [rawCompanyId]
  );

  const [trips, setTrips] = useState<Trip[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterMethod, setFilterMethod] = useState<"ALL" | PaymentMethod>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | PaymentStatus>("ALL");

  useEffect(() => {
    if (!companyId) return;

    const tripsRef = collection(db, "companies", companyId, "trips");

    const unsub = onSnapshot(
      tripsRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Trip, "id">),
        }));

        rows.sort((a, b) =>
          String(b.assignedAt ?? "").localeCompare(String(a.assignedAt ?? ""))
        );

        const filtered = rows.filter(
          (t) =>
            !t.payment?.status ||
            t.payment.status === "pending_cashier" ||
            t.payment.status === "partial"
        );

        setTrips(filtered);
      },
      (error) => {
        console.error(error);
        setNotice(error.message || "Failed to load trips.");
      }
    );

    return () => unsub();
  }, [companyId]);

  const filteredTrips = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesSearch =
        !q ||
        String(trip.tripCode ?? "").toLowerCase().includes(q) ||
        String(trip.truckPlate ?? "").toLowerCase().includes(q) ||
        String(trip.driverName ?? "").toLowerCase().includes(q) ||
        String(trip.startCity ?? "").toLowerCase().includes(q) ||
        String(trip.destinationCity ?? "").toLowerCase().includes(q) ||
        String(trip.ownerName ?? "").toLowerCase().includes(q);

      const matchesMethod =
        filterMethod === "ALL" ||
        String(trip.payment?.method ?? "cash") === filterMethod;

      const matchesStatus =
        filterStatus === "ALL" ||
        String(trip.payment?.status ?? "pending_cashier") === filterStatus;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [trips, searchText, filterMethod, filterStatus]);

  async function sendOwnerPaymentTelegram(args: {
    trip: Trip;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    balance: number;
    paymentStatus: PaymentStatus;
    receiptNumber: string;
    referenceNumber: string;
  }) {
    const {
      trip,
      paymentMethod,
      paidAmount,
      balance,
      paymentStatus,
      receiptNumber,
      referenceNumber,
    } = args;

    const chatId = String(trip.ownerTelegramChatId ?? "").trim();
    if (!chatId) return;

    const methodLabel =
      paymentMethod === "bank"
        ? "Bank"
        : paymentMethod === "mobile"
        ? "Mobile Transfer"
        : paymentMethod === "credit"
        ? "Credit / Unpaid"
        : "Cash";

    const statusLabel =
      paymentStatus === "pending_cashier"
        ? "Pending Cashier"
        : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);

    const message = `💰 Payment Update

Trip: ${trip.startCity || "-"} → ${trip.destinationCity || "-"}
Truck: ${trip.truckPlate || "-"}
Driver: ${trip.driverName || "-"}
Trip Code: ${trip.tripCode || "-"}

Method: ${methodLabel}
Paid: ETB ${paidAmount.toLocaleString()}
Balance: ETB ${balance.toLocaleString()}
Status: ${statusLabel}
Receipt No: ${receiptNumber || "-"}
Reference No: ${referenceNumber || "-"}
Owner: ${trip.ownerName || "-"}`;

    const res = await fetch("/api/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });

    if (!res.ok) {
      throw new Error(`Telegram send failed (${res.status})`);
    }
  }

  async function handleSavePayment(trip: Trip, formData: FormData) {
    const paymentMethod = String(
      formData.get("paymentMethod") || "cash"
    ) as PaymentMethod;

    const paidAmount = Number(formData.get("paidAmount") || 0);
    const receiptNumber = String(formData.get("receiptNumber") || "").trim();
    const referenceNumber = String(formData.get("referenceNumber") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const file = formData.get("receiptFile") as File | null;

    const expectedAmount = Number(
      trip.payment?.expectedAmount ?? trip.agreedCost ?? 0
    );

    const balance = Math.max(expectedAmount - paidAmount, 0);

    let paymentStatus: PaymentStatus = "partial";
    if (paymentMethod === "credit") {
      paymentStatus = "pending_cashier";
    } else if (paidAmount <= 0) {
      paymentStatus = "rejected";
    } else if (balance === 0) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partial";
    }

    if (paymentMethod !== "credit" && paidAmount <= 0) {
      setNotice("Paid amount is required.");
      return;
    }

    try {
      setSavingId(trip.id);
      setNotice(null);

      let receiptUrl = trip.payment?.receiptUrl ?? "";
      let receiptPath = trip.payment?.receiptPath ?? "";

      if (file) {
        const path = `companies/${companyId}/trips/${trip.id}/receipts/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        receiptUrl = await getDownloadURL(storageRef);
        receiptPath = path;
      }

      const tripRef = doc(db, "companies", companyId, "trips", trip.id);

      await updateDoc(tripRef, {
        "payment.method": paymentMethod,
        "payment.status": paymentStatus,
        "payment.expectedAmount": expectedAmount,
        "payment.paidAmount": paidAmount,
        "payment.balance": balance,
        "payment.currency": "ETB",
        "payment.receiptNumber": receiptNumber,
        "payment.receiptUrl": receiptUrl,
        "payment.receiptPath": receiptPath,
        "payment.referenceNumber": referenceNumber,
        "payment.note": note,
        "payment.acceptedBy": "cashierUid_here",
        "payment.acceptedAt": serverTimestamp(),
        updatedAt: new Date().toISOString(),
      });

      let ownerTelegramNotice = "";
      try {
        await sendOwnerPaymentTelegram({
          trip,
          paymentMethod,
          paidAmount,
          balance,
          paymentStatus,
          receiptNumber,
          referenceNumber,
        });
        if (trip.ownerTelegramChatId) {
          ownerTelegramNotice = " Owner notified on Telegram.";
        }
      } catch (telegramError: any) {
        console.error("TELEGRAM_NOTIFY_ERROR:", telegramError);
        ownerTelegramNotice = " Payment saved, but Telegram notification failed.";
      }

      setNotice(`✅ Payment saved successfully.${ownerTelegramNotice}`);
    } catch (error: any) {
      console.error(error);
      setNotice(error?.message || "Failed to save payment.");
    } finally {
      setSavingId(null);
    }
  }

  const pendingCount = trips.filter(
    (trip) =>
      !trip.payment?.status ||
      trip.payment?.status === "pending_cashier" ||
      trip.payment?.status === "partial"
  ).length;

  if (!companyId) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Missing companyId.</div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 24,
        paddingTop: 40,
      }}
    >
      <div style={{ maxWidth: 1220, margin: "40px auto 0" }}>
        <div
          style={{
            borderRadius: 30,
            padding: 28,
            border: "1px solid rgba(0,0,0,0.08)",
            background:
              "linear-gradient(135deg, #10b981 0%, #14b8a6 48%, #0891b2 100%)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.16)",
            color: "white",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -40,
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 35%, rgba(255,255,255,0.18), transparent 50%)",
            }}
            aria-hidden="true"
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "grid", gap: 10, maxWidth: 820 }}>
                <span
                  style={{
                    width: "fit-content",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: 0.35,
                  }}
                >
                  CASHIER
                </span>

                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 1000,
                    letterSpacing: 0.2,
                    lineHeight: 1.05,
                  }}
                >
                  Cashier Workspace
                </div>

                <div style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6 }}>
                  Review dispatcher trip details, choose payment method, upload
                  receipts, and finalize payment records.
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/portal/tracking/${companyId}/tracking`}
                    style={{
                      textDecoration: "none",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      color: "white",
                      fontWeight: 950,
                      fontSize: 14,
                      width: "fit-content",
                    }}
                  >
                    ← Back to Tracking Hub
                  </Link>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  padding: 16,
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.24)",
                  minWidth: 250,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 950 }}>
                  Pending Queue
                </div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 1000 }}>
                  {pendingCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 18,
              border: "1px solid rgba(245,158,11,0.28)",
              background: "rgba(245,158,11,0.10)",
              fontSize: 14,
              fontWeight: 950,
            }}
          >
            Notice: {notice}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 1000,
              letterSpacing: 0.2,
              color: "#0f172a",
              marginBottom: 14,
            }}
          >
            Dispatcher Trips for Payment Review
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search trip code, truck, driver, route..."
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontWeight: 900,
                background: "white",
              }}
            />

            <select
              value={filterMethod}
              onChange={(e) =>
                setFilterMethod(e.target.value as "ALL" | PaymentMethod)
              }
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontWeight: 900,
                background: "white",
              }}
            >
              <option value="ALL">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mobile">Mobile Transfer</option>
              <option value="credit">Credit / Unpaid</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "ALL" | PaymentStatus)
              }
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                fontWeight: 900,
                background: "white",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="pending_cashier">Pending Cashier</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredTrips.length === 0 ? (
            <div
              style={{
                background: "white",
                borderRadius: 22,
                padding: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                fontWeight: 900,
              }}
            >
              No pending or partial trips found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 18,
              }}
            >
              {filteredTrips.map((trip) => {
                const expectedAmount = Number(
                  trip.payment?.expectedAmount ?? trip.agreedCost ?? 0
                );
                const paidAmount = Number(trip.payment?.paidAmount ?? 0);
                const balance = Number(
                  trip.payment?.balance ?? Math.max(expectedAmount - paidAmount, 0)
                );
                const paymentStatus = trip.payment?.status ?? "pending_cashier";
                const isPaid = paymentStatus === "paid";

                return (
                  <div
                    key={trip.id}
                    style={{
                      borderRadius: 24,
                      padding: 22,
                      background: "white",
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.15fr 0.95fr",
                        gap: 22,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            alignItems: "flex-start",
                            marginBottom: 16,
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <span
                              style={{
                                width: "fit-content",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background:
                                  paymentStatus === "paid"
                                    ? "rgba(16,185,129,0.14)"
                                    : paymentStatus === "partial"
                                    ? "rgba(245,158,11,0.14)"
                                    : paymentStatus === "rejected"
                                    ? "rgba(239,68,68,0.14)"
                                    : "rgba(59,130,246,0.12)",
                                border: "1px solid rgba(0,0,0,0.08)",
                                fontSize: 12,
                                fontWeight: 950,
                                color:
                                  paymentStatus === "paid"
                                    ? "#047857"
                                    : paymentStatus === "partial"
                                    ? "#b45309"
                                    : paymentStatus === "rejected"
                                    ? "#b91c1c"
                                    : "#1d4ed8",
                              }}
                            >
                              {paymentStatus === "pending_cashier"
                                ? "Pending Cashier"
                                : paymentStatus.charAt(0).toUpperCase() +
                                  paymentStatus.slice(1)}
                            </span>

                            <div
                              style={{
                                fontSize: 26,
                                fontWeight: 1000,
                                color: "#0f172a",
                              }}
                            >
                              {trip.startCity || "-"} → {trip.destinationCity || "-"}
                            </div>
                          </div>

                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 22,
                              background:
                                "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(8,145,178,0.16) 100%)",
                              border: "1px solid rgba(0,0,0,0.08)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 30,
                              flex: "0 0 auto",
                            }}
                          >
                            🧾
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 1000,
                            color: "#0f172a",
                            marginBottom: 10,
                          }}
                        >
                          Trip Summary
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <Field label="Trip Code" value={trip.tripCode || "-"} />
                          <Field label="Trip Type" value={trip.tripType || "-"} />
                          <Field label="Driver Name" value={trip.driverName || "-"} />
                          <Field label="Truck Plate" value={trip.truckPlate || "-"} />
                          <Field label="Load Type" value={trip.loadType || "-"} />
                          <Field
                            label="Trip Status"
                            value={trip.status || "ASSIGNED"}
                          />
                          <Field
                            label="Agreed Cost"
                            value={`ETB ${trip.agreedCost ?? 0}`}
                          />
                          <Field
                            label="Assigned At"
                            value={trip.assignedAt || "-"}
                          />
                          <Field label="Owner Name" value={trip.ownerName || "-"} />
                          <Field label="Owner Phone" value={trip.ownerPhone || "-"} />
                          <Field
                            label="Owner Telegram"
                            value={trip.ownerTelegramChatId || "-"}
                          />
                          <Field label="Trip ID" value={trip.id} />
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 1000,
                            color: "#0f172a",
                            marginBottom: 10,
                          }}
                        >
                          Payment Processing
                        </div>

                        <form
                          action={async (formData) => {
                            await handleSavePayment(trip, formData);
                          }}
                          style={{
                            display: "grid",
                            gap: 12,
                            opacity: isPaid ? 0.7 : 1,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
                              gap: 12,
                            }}
                          >
                            <ReadBox
                              label="Expected Amount"
                              value={`ETB ${expectedAmount}`}
                            />
                            <ReadBox
                              label="Current Balance"
                              value={`ETB ${balance}`}
                            />
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 13,
                                color: "#334155",
                                marginBottom: 6,
                              }}
                            >
                              Payment Method *
                            </div>
                            <select
                              name="paymentMethod"
                              defaultValue={trip.payment?.method || "cash"}
                              style={inputStyle}
                              required
                              disabled={isPaid || savingId === trip.id}
                            >
                              <option value="cash">Cash</option>
                              <option value="bank">Bank</option>
                              <option value="mobile">Mobile Transfer</option>
                              <option value="credit">Credit / Unpaid</option>
                            </select>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
                              gap: 12,
                            }}
                          >
                            <InputField
                              label="Paid Amount *"
                              name="paidAmount"
                              type="number"
                              placeholder="Amount paid"
                              defaultValue={
                                trip.payment?.paidAmount != null
                                  ? String(trip.payment.paidAmount)
                                  : ""
                              }
                              disabled={isPaid || savingId === trip.id}
                            />
                            <InputField
                              label="Receipt Number"
                              name="receiptNumber"
                              placeholder="Receipt Number"
                              defaultValue={trip.payment?.receiptNumber || ""}
                              disabled={isPaid || savingId === trip.id}
                            />
                          </div>

                          <InputField
                            label="Reference Number"
                            name="referenceNumber"
                            placeholder="Bank / mobile reference"
                            defaultValue={trip.payment?.referenceNumber || ""}
                            disabled={isPaid || savingId === trip.id}
                          />

                          <div>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 13,
                                color: "#334155",
                                marginBottom: 6,
                              }}
                            >
                              Upload Receipt / Take Photo
                            </div>
                            <input
                              name="receiptFile"
                              type="file"
                              accept="image/*,.pdf"
                              capture="environment"
                              style={inputStyle}
                              disabled={isPaid || savingId === trip.id}
                            />
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: "#64748b",
                                fontWeight: 800,
                              }}
                            >
                              On phone: opens camera for receipt photo. On desktop:
                              choose image or PDF.
                            </div>
                          </div>

                          {trip.payment?.receiptUrl && (
                            <a
                              href={trip.payment.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                width: "fit-content",
                                color: "#0f766e",
                                fontWeight: 900,
                                textDecoration: "none",
                              }}
                            >
                              View Receipt ↗
                            </a>
                          )}

                          <InputField
                            label="Note"
                            name="note"
                            placeholder="Optional cashier note"
                            defaultValue={trip.payment?.note || ""}
                            disabled={isPaid || savingId === trip.id}
                          />

                          <button
                            type="submit"
                            disabled={isPaid || savingId === trip.id}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 14,
                              border: "1px solid rgba(0,0,0,0.10)",
                              background: isPaid ? "#94a3b8" : "#0f172a",
                              color: "white",
                              fontWeight: 1000,
                              cursor:
                                isPaid || savingId === trip.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: isPaid || savingId === trip.id ? 0.7 : 1,
                            }}
                          >
                            {isPaid
                              ? "Already Paid"
                              : savingId === trip.id
                              ? "Saving..."
                              : "Save Payment"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: "#64748b",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: "#0f172a",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ReadBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: "#64748b",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 1000,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue = "",
  disabled = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 13,
          color: "#334155",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "text",
          background: disabled ? "#f1f5f9" : "white",
        }}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  fontWeight: 900,
  background: "white",
};