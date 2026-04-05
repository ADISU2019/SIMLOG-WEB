// app/portal/tracking/[companyId]/reports/trips/page.tsx
"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { exportToExcel, exportToPdf } from "@/lib/exports";

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type PaymentMethod = "cash" | "bank" | "mobile" | "credit";
type PaymentStatus = "pending_cashier" | "paid" | "partial" | "rejected";

type TripRow = {
  tripId: string;
  tripCode?: string | null;
  tripType?: string | null;
  status: TripStatus | string;

  truckPlate?: string | null;
  driverName?: string | null;
  startCity?: string | null;
  destinationCity?: string | null;

  loadType?: string | null;
  agreedCost?: number | string | null;

  assignedAt?: string | null;
  updatedAt?: string | null;

  payment?: {
    method?: PaymentMethod | string | null;
    status?: PaymentStatus | string | null;
    expectedAmount?: number | string | null;
    paidAmount?: number | string | null;
    balance?: number | string | null;
    currency?: string | null;
    receiptNumber?: string | null;
    receiptUrl?: string | null;
    receiptPath?: string | null;
    referenceNumber?: string | null;
    acceptedBy?: string | null;
    acceptedAt?: string | null;
    note?: string | null;
  } | null;
};

type TripsReportResponse = {
  companyId: string;
  rows: TripRow[];
  totals?: {
    tripCount: number;
    statusBreakdown?: Record<string, number>;
  };
};

type ExportColumn = { key: string; header: string };
type ExportPayload = {
  title: string;
  meta?: string[];
  columns: ExportColumn[];
  rows: Record<string, any>[];
};

// -----------------------------
// Helpers
// -----------------------------
function clampLimit(n: number, min = 1, max = 500) {
  const x = Number.isFinite(n) ? n : max;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function parseTripIdsParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtIso(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function money(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
}

/** Pills in hero + table */
function pillStyle(bg: string, border = "1px solid rgba(255,255,255,0.22)") {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    background: bg,
    border,
    fontWeight: 1100,
    fontSize: 13,
    letterSpacing: 0.2,
    whiteSpace: "nowrap" as const,
  };
}

function statusPill(status: string) {
  const s = String(status ?? "ASSIGNED").toUpperCase();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    fontWeight: 1100,
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    color: "#0f172a",
    background: "rgba(245,158,11,0.16)",
  };

  if (s === "COMPLETED") return { ...base, background: "rgba(34,197,94,0.16)" };
  if (s === "IN_PROGRESS") return { ...base, background: "rgba(59,130,246,0.16)" };
  if (s === "STARTED") return { ...base, background: "rgba(99,102,241,0.16)" };
  if (s === "CANCELLED") return { ...base, background: "rgba(100,116,139,0.16)" };
  return base;
}

function paymentStatusPill(status?: string | null) {
  const s = String(status ?? "pending_cashier").toLowerCase();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    fontWeight: 1100,
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    color: "#0f172a",
    background: "rgba(59,130,246,0.12)",
  };

  if (s === "paid") return { ...base, background: "rgba(34,197,94,0.16)" };
  if (s === "partial") return { ...base, background: "rgba(245,158,11,0.16)" };
  if (s === "rejected") return { ...base, background: "rgba(239,68,68,0.16)" };
  return base;
}

function paymentStatusLabel(status?: string | null) {
  const s = String(status ?? "pending_cashier").toLowerCase();
  if (s === "pending_cashier") return "Pending Cashier";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paymentMethodLabel(method?: string | null) {
  const m = String(method ?? "cash").toLowerCase();
  if (m === "mobile") return "Mobile";
  if (m === "credit") return "Credit";
  if (m === "bank") return "Bank";
  return "Cash";
}

function tripTypeLabel(tt?: string | null) {
  const t = String(tt ?? "ONE_WAY").toUpperCase();
  if (t === "ROUND_TRIP") return "Round Trip";
  return "One way";
}

function rowBgByTripType(tt?: string | null, idx = 0) {
  const t = String(tt ?? "ONE_WAY").toUpperCase();
  if (t === "ONE_WAY")
    return idx % 2 === 0
      ? "rgba(186, 230, 253, 0.35)"
      : "rgba(186, 230, 253, 0.22)";
  if (t === "ROUND_TRIP")
    return idx % 2 === 0
      ? "rgba(220, 252, 231, 0.45)"
      : "rgba(220, 252, 231, 0.28)";
  return idx % 2 === 0
    ? "rgba(251, 207, 232, 0.35)"
    : "rgba(251, 207, 232, 0.22)";
}

function fmtNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}

/** ✅ Pro-grade stat tiles: bold + larger fonts + strong gradients */
function ProStatTile({
  label,
  value,
  sub,
  gradient,
}: {
  label: string;
  value: string;
  sub: string;
  gradient: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 230px",
        borderRadius: 18,
        padding: 18,
        background: gradient,
        border: "1px solid rgba(255,255,255,0.24)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.18)",
        color: "white",
        minHeight: 118,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -60,
          background:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 35%, rgba(255,255,255,0.16), transparent 52%)",
        }}
        aria-hidden="true"
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 13, opacity: 0.95, fontWeight: 1200, letterSpacing: 0.3 }}>
          {label}
        </div>
        <div style={{ marginTop: 12, fontSize: 34, fontWeight: 1300, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92, fontWeight: 1100 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

async function fetchJsonWithFallback(urls: string[]) {
  let lastErr = "Unknown error";
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok) return { ok: true as const, json };
      if (res.status === 404) {
        lastErr = `404 at ${url}`;
        continue;
      }
      lastErr = json?.error ?? `Failed (${res.status})`;
      return { ok: false as const, error: lastErr };
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
    }
  }
  return { ok: false as const, error: lastErr };
}

// -----------------------------
// Page
// -----------------------------
export default function TripsReportPage() {
  const params = useParams<{ companyId?: string }>();
  const searchParams = useSearchParams();

  const companyId = useMemo(
    () => String(params?.companyId ?? "").trim(),
    [params?.companyId]
  );

  const selectedTripIds = useMemo(
    () => parseTripIdsParam(searchParams?.get("tripIds") ?? null),
    [searchParams]
  );

  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);
  const hrefHub = useMemo(() => `${base}`, [base]);
  const hrefTrips = useMemo(() => `${base}/tracking`, [base]);
  const hrefFuel = useMemo(() => `${base}/reports/fuel`, [base]);
  const hrefDriver = useMemo(() => `${base}/driver`, [base]);

  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(200);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState<TripsReportResponse | null>(null);

  async function loadReport() {
    if (!companyId) return;

    setLoading(true);
    setNotice(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const qs = new URLSearchParams();
      if (status.trim()) qs.set("status", status.trim().toUpperCase());
      qs.set("limit", String(clampLimit(Number(limit), 1, 500)));

      const reportCandidates = [
        `${origin}/api/portal/tracking/${companyId}/reports/trips?${qs.toString()}`,
        `${origin}/api/portal/tracking/${companyId}/tracking/reports/trips?${qs.toString()}`,
      ];

      const listCandidates = [
        `${origin}/api/portal/tracking/${companyId}/tracking/trips/list?limit=${clampLimit(
          Number(limit),
          1,
          500
        )}`,
      ];

      let rows: TripRow[] = [];
      let company = companyId;

      const r1 = await fetchJsonWithFallback(reportCandidates);
      if (r1.ok) {
        const j = r1.json as any;
        company = String(j.companyId ?? companyId);
        rows = Array.isArray(j.rows) ? j.rows : Array.isArray(j.trips) ? j.trips : [];
      } else {
        const r2 = await fetchJsonWithFallback(listCandidates);
        if (!r2.ok) throw new Error(r2.error || "Failed to load trips");

        const j = r2.json as any;
        const list = Array.isArray(j.trips)
          ? j.trips
          : Array.isArray(j.rows)
          ? j.rows
          : Array.isArray(j)
          ? j
          : [];

        rows = list.map((t: any) => ({
          tripId: String(t?.id ?? t?.tripId ?? ""),
          tripCode: t?.tripCode ?? t?.code ?? null,
          tripType: t?.tripType ?? t?.type ?? null,
          status: t?.status ?? "ASSIGNED",
          truckPlate: t?.truckPlate ?? null,
          driverName: t?.driverName ?? null,
          startCity: t?.startCity ?? null,
          destinationCity: t?.destinationCity ?? null,
          loadType: t?.loadType ?? null,
          agreedCost: t?.agreedCost ?? null,
          assignedAt: t?.assignedAt ?? null,
          updatedAt: t?.updatedAt ?? null,
          payment: t?.payment
            ? {
                method: t.payment?.method ?? null,
                status: t.payment?.status ?? null,
                expectedAmount: t.payment?.expectedAmount ?? null,
                paidAmount: t.payment?.paidAmount ?? t.payment?.amount ?? null,
                balance: t.payment?.balance ?? null,
                currency: t.payment?.currency ?? "ETB",
                receiptNumber: t.payment?.receiptNumber ?? null,
                receiptUrl: t.payment?.receiptUrl ?? null,
                receiptPath: t.payment?.receiptPath ?? null,
                referenceNumber: t.payment?.referenceNumber ?? null,
                acceptedBy: t.payment?.acceptedBy ?? null,
                acceptedAt: t.payment?.acceptedAt ?? null,
                note: t.payment?.note ?? null,
              }
            : null,
        })) as TripRow[];
      }

      if (status.trim()) {
        const s = status.trim().toUpperCase();
        rows = rows.filter((r) => String(r.status ?? "").toUpperCase() === s);
      }

      if (selectedTripIds.length > 0) {
        rows = rows.filter((r) => r.tripId && selectedTripIds.includes(r.tripId));
      }

      const breakdown = rows.reduce<Record<string, number>>((acc, r) => {
        const s = String(r.status ?? "ASSIGNED").toUpperCase();
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {});

      setData({
        companyId: company,
        rows,
        totals: {
          tripCount: rows.length,
          statusBreakdown: breakdown,
        },
      });
    } catch (e: any) {
      setNotice(e?.message ?? "Failed to load trips report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, selectedTripIds.join(",")]);

  function exportRows(kind: "excel" | "pdf") {
    if (!data) return;

    const meta: string[] = [
      `Company: ${data.companyId}`,
      selectedTripIds.length
        ? `Selected trips: ${selectedTripIds.length}`
        : `Trips: ${data.rows.length}`,
      status.trim() ? `Status: ${status.trim().toUpperCase()}` : "Status: ALL",
      `Exported: ${new Date().toLocaleString()}`,
    ];

    const columns: ExportColumn[] = [
      { key: "tripType", header: "TripType" },
      { key: "status", header: "Status" },
      { key: "paymentStatus", header: "Payment Status" },
      { key: "paymentMethod", header: "Payment Method" },
      { key: "expectedAmount", header: "Expected Amount" },
      { key: "paidAmount", header: "Paid Amount" },
      { key: "balance", header: "Balance" },
      { key: "receiptNumber", header: "Receipt Number" },
      { key: "referenceNumber", header: "Reference Number" },
      { key: "acceptedAt", header: "Accepted At" },
      { key: "dateTime", header: "Date/Time" },
      { key: "agreedCost", header: "Agreed Cost" },
      { key: "truckPlate", header: "Truck" },
      { key: "driverName", header: "Driver" },
      { key: "startCity", header: "Start City" },
      { key: "destinationCity", header: "Destination City" },
      { key: "tripId", header: "Trip ID" },
      { key: "tripCode", header: "Trip Code" },
      { key: "loadType", header: "Load Type" },
    ];

    const outRows = data.rows.map((r) => ({
      tripType: tripTypeLabel(r.tripType ?? null),
      status: String(r.status ?? "ASSIGNED"),
      paymentStatus: paymentStatusLabel(r.payment?.status),
      paymentMethod: paymentMethodLabel(r.payment?.method),
      expectedAmount: money(r.payment?.expectedAmount ?? r.agreedCost),
      paidAmount: money(r.payment?.paidAmount),
      balance: money(r.payment?.balance),
      receiptNumber: r.payment?.receiptNumber ?? "-",
      referenceNumber: r.payment?.referenceNumber ?? "-",
      acceptedAt: fmtIso(r.payment?.acceptedAt ?? null),
      dateTime: fmtIso(r.updatedAt ?? r.assignedAt ?? null),
      agreedCost: money(r.agreedCost),
      truckPlate: r.truckPlate ?? "-",
      driverName: r.driverName ?? "-",
      startCity: r.startCity ?? "-",
      destinationCity: r.destinationCity ?? "-",
      tripId: r.tripId,
      tripCode: r.tripCode ?? "-",
      loadType: r.loadType ?? "-",
    }));

    const payload: ExportPayload = {
      title: `Trips Report - ${data.companyId}`,
      meta,
      columns,
      rows: outRows,
    };

    if (kind === "excel") exportToExcel(payload);
    else exportToPdf(payload);
  }

  if (!companyId) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ fontWeight: 1000 }}>
          Missing companyId in URL.
          <div style={{ marginTop: 12 }}>
            <Link href="/portal/tracking">← Back to Workspaces</Link>
          </div>
        </div>
      </main>
    );
  }

  const tripCount = data?.totals?.tripCount ?? 0;
  const breakdown = data?.totals?.statusBreakdown ?? {};
  const completed = breakdown["COMPLETED"] ?? 0;
  const inProgress = breakdown["IN_PROGRESS"] ?? 0;
  const cancelled = breakdown["CANCELLED"] ?? 0;

  const totalAgreed = (data?.rows ?? []).reduce(
    (sum, r) => sum + (Number(r.agreedCost) || 0),
    0
  );
  const totalExpected = (data?.rows ?? []).reduce(
    (sum, r) => sum + (Number(r.payment?.expectedAmount ?? r.agreedCost) || 0),
    0
  );
  const totalPaid = (data?.rows ?? []).reduce(
    (sum, r) => sum + (Number(r.payment?.paidAmount) || 0),
    0
  );
  const totalBalance = (data?.rows ?? []).reduce(
    (sum, r) => sum + (Number(r.payment?.balance) || 0),
    0
  );
  const paidTrips = (data?.rows ?? []).filter(
    (r) => String(r.payment?.status ?? "").toLowerCase() === "paid"
  ).length;
  const partialTrips = (data?.rows ?? []).filter(
    (r) => String(r.payment?.status ?? "").toLowerCase() === "partial"
  ).length;
  const pendingCashierTrips = (data?.rows ?? []).filter((r) => {
    const s = String(r.payment?.status ?? "pending_cashier").toLowerCase();
    return s === "pending_cashier" || !r.payment?.status;
  }).length;

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* HERO */}
      <section style={{ padding: "18px 18px 14px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 28,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #7c3aed 100%)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.14)",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -40,
                background:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 85% 30%, rgba(255,255,255,0.12), transparent 50%)",
              }}
              aria-hidden="true"
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={pillStyle("rgba(255,255,255,0.18)")}>TRACKING · REPORTS</span>

              <div style={{ marginTop: 10, fontSize: 60, fontWeight: 1300, lineHeight: 1.02 }}>
                Trips Report
              </div>

              <div style={{ marginTop: 10, fontSize: 16, opacity: 0.92, fontWeight: 950 }}>
                {selectedTripIds.length > 0
                  ? `Showing selected trips: ${selectedTripIds.length}`
                  : `Showing trips for company: ${companyId}`}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={hrefHub}
                  style={{ textDecoration: "none", ...pillStyle("rgba(255,255,255,0.16)"), color: "white" }}
                >
                  ← Workspace Hub
                </Link>
                <Link
                  href={hrefTrips}
                  style={{ textDecoration: "none", ...pillStyle("rgba(255,255,255,0.16)"), color: "white" }}
                >
                  ← Trips Dashboard
                </Link>
                <Link
                  href={hrefFuel}
                  style={{ textDecoration: "none", ...pillStyle("rgba(255,255,255,0.16)"), color: "white" }}
                >
                  Fuel Report →
                </Link>
                <Link
                  href={hrefDriver}
                  style={{ textDecoration: "none", ...pillStyle("rgba(255,255,255,0.16)"), color: "white" }}
                >
                  Driver Access →
                </Link>

                <button
                  onClick={loadReport}
                  disabled={loading}
                  style={{
                    ...pillStyle("rgba(255,255,255,0.22)"),
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  onClick={() => exportRows("excel")}
                  disabled={!data || loading}
                  style={{
                    ...pillStyle("rgba(255,255,255,0.22)"),
                    color: "white",
                    cursor: !data || loading ? "not-allowed" : "pointer",
                  }}
                >
                  Export Excel
                </button>

                <button
                  onClick={() => exportRows("pdf")}
                  disabled={!data || loading}
                  style={{
                    ...pillStyle("rgba(255,255,255,0.22)"),
                    color: "white",
                    cursor: !data || loading ? "not-allowed" : "pointer",
                  }}
                >
                  Export PDF
                </button>
              </div>

              {/* Filters */}
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 20,
                  padding: 14,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Status (optional)"
                  style={{
                    width: 240,
                    padding: 13,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 1200,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.98)",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
                <input
                  value={String(limit)}
                  onChange={(e) => setLimit(Number(e.target.value) || 200)}
                  placeholder="Limit"
                  inputMode="numeric"
                  style={{
                    width: 140,
                    padding: 13,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 1300,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.98)",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />

                <button
                  onClick={loadReport}
                  disabled={loading}
                  style={{
                    padding: "13px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "white",
                    color: "#0f172a",
                    fontWeight: 1300,
                    fontSize: 14,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Apply
                </button>

                <span style={{ ...pillStyle("rgba(255,255,255,0.20)"), color: "white" }}>
                  Trips: {fmtNum(tripCount)}
                </span>

                <style jsx>{`
                  input::placeholder {
                    color: rgba(15, 23, 42, 0.6);
                    font-weight: 1100;
                  }
                `}</style>
              </div>

              {/* Trip summary tiles */}
              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ProStatTile
                  label="Trips"
                  value={fmtNum(tripCount)}
                  sub={`Company: ${companyId}`}
                  gradient="linear-gradient(135deg, rgba(20,184,166,0.90), rgba(59,130,246,0.58))"
                />
                <ProStatTile
                  label="Completed"
                  value={fmtNum(completed)}
                  sub="Finished trips"
                  gradient="linear-gradient(135deg, rgba(34,197,94,0.90), rgba(16,185,129,0.55))"
                />
                <ProStatTile
                  label="In Progress"
                  value={fmtNum(inProgress)}
                  sub="Active trips"
                  gradient="linear-gradient(135deg, rgba(245,158,11,0.92), rgba(249,115,22,0.55))"
                />
                <ProStatTile
                  label="Cancelled"
                  value={fmtNum(cancelled)}
                  sub="Stopped trips"
                  gradient="linear-gradient(135deg, rgba(239,68,68,0.92), rgba(236,72,153,0.55))"
                />
              </div>

              {/* Cash/payment summary tiles */}
              <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ProStatTile
                  label="Total Agreed"
                  value={money(totalAgreed)}
                  sub="All trip agreed cost"
                  gradient="linear-gradient(135deg, rgba(99,102,241,0.92), rgba(59,130,246,0.58))"
                />
                <ProStatTile
                  label="Total Paid"
                  value={money(totalPaid)}
                  sub="Collected by cashier"
                  gradient="linear-gradient(135deg, rgba(16,185,129,0.92), rgba(6,182,212,0.55))"
                />
                <ProStatTile
                  label="Outstanding"
                  value={money(totalBalance)}
                  sub="Remaining balance"
                  gradient="linear-gradient(135deg, rgba(245,158,11,0.92), rgba(239,68,68,0.55))"
                />
                <ProStatTile
                  label="Paid / Partial / Pending"
                  value={`${fmtNum(paidTrips)} / ${fmtNum(partialTrips)} / ${fmtNum(
                    pendingCashierTrips
                  )}`}
                  sub="Payment workflow status"
                  gradient="linear-gradient(135deg, rgba(14,165,233,0.92), rgba(124,58,237,0.58))"
                />
              </div>
            </div>
          </div>

          {notice && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 18,
                padding: 14,
                border: "1px solid rgba(245,158,11,0.28)",
                background: "rgba(245,158,11,0.10)",
                fontWeight: 1000,
              }}
            >
              Notice: {notice}
            </div>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section style={{ padding: "0 18px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 1200, color: "#0f172a" }}>Trips + Cash Payment Report</div>
            <div style={{ marginTop: 6, fontSize: 15, opacity: 0.82, fontWeight: 950, color: "#0f172a" }}>
              Report view with trip details and cashier payment details.
            </div>

            <div style={{ marginTop: 14, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1680 }}>
                <thead>
                  <tr style={{ background: "rgba(245, 158, 11, 0.28)" }}>
                    {[
                      "TripType",
                      "Status",
                      "Payment Status",
                      "Payment Method",
                      "Expected",
                      "Paid",
                      "Balance",
                      "Receipt No.",
                      "Reference No.",
                      "Accepted At",
                      "Date/Time",
                      "Agreed Cost",
                      "Truck",
                      "Driver",
                      "Start City",
                      "Destination City",
                      "Trip ID",
                      "Trip Code",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: 12,
                          borderBottom: "1px solid rgba(0,0,0,0.08)",
                          textAlign: "left",
                          fontWeight: 1200,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {(data?.rows ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={18} style={{ padding: 16, fontWeight: 1000, opacity: 0.85 }}>
                        {loading ? "Loading…" : "No rows."}
                      </td>
                    </tr>
                  ) : (
                    (data?.rows ?? []).map((r, idx) => {
                      const bg = rowBgByTripType(r.tripType ?? null, idx);
                      const dt = fmtIso(r.updatedAt ?? r.assignedAt ?? null);

                      return (
                        <tr key={r.tripId} style={{ background: bg }}>
                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {tripTypeLabel(r.tripType ?? null)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={statusPill(String(r.status ?? "ASSIGNED"))}>
                              {String(r.status ?? "ASSIGNED")}
                            </span>
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={paymentStatusPill(r.payment?.status)}>
                              {paymentStatusLabel(r.payment?.status)}
                            </span>
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {paymentMethodLabel(r.payment?.method)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {money(r.payment?.expectedAmount ?? r.agreedCost)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {money(r.payment?.paidAmount)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {money(r.payment?.balance)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.payment?.receiptNumber ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.payment?.referenceNumber ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13, fontWeight: 950 }}>
                            {fmtIso(r.payment?.acceptedAt ?? null)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13, fontWeight: 950 }}>
                            {dt}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {money(r.agreedCost)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {r.truckPlate ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.driverName ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.startCity ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.destinationCity ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {String(r.tripId).slice(0, 8)}…
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {r.tripCode ?? "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75, fontWeight: 950 }}>
              Tip: This report now combines dispatcher trip data with cashier payment data.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}