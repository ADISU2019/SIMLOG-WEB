// app/portal/tracking/[companyId]/reports/fuel/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { exportToExcel, exportToPdf } from "@/lib/exports";

/**
 * =========================================================
 * FUEL REPORT (Dispatcher)
 * URL:
 *   /portal/tracking/[companyId]/reports/fuel
 * =========================================================
 */

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

type FuelRow = {
  tripId: string;
  status: string;

  truckPlate: string;
  driverName: string;
  route: string;

  assignedDate: string;
  updatedDate: string;
  startedDate: string;
  completedDate: string;
  lastFuelGaugeDate: string;

  lastFuelGaugePercent?: number;
  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  fuelFlags: FuelFlag[];
};

type FuelApiResponse = {
  companyId: string;
  range: {
    from: string;
    to: string;
    fromIso: string;
    toIso: string;
  };
  filters: {
    status: string | null;
    limit: number;
  };
  totals: {
    tripCount: number;
    fuelUsedLitersSum: number;
    extraCostSum: number;
    flagsCount: number;
    flagsBreakdown: Record<string, number>;
  };
  rows: FuelRow[];
};

type ExportColumn = { key: string; header: string };
type ExportPayload = {
  title: string;
  meta?: string[];
  columns: ExportColumn[];
  rows: Record<string, any>[];
};

function clampLimit(n: number, min = 1, max = 500) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function parseTripIdsParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
}

function pillStyle(bg: string) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    background: bg,
    border: "1px solid rgba(255,255,255,0.22)",
    fontWeight: 1000,
    fontSize: 13,
    letterSpacing: 0.2,
    whiteSpace: "nowrap" as const,
  };
}

function statusChip(status: string) {
  const s = String(status ?? "").toUpperCase();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 1100,
    fontSize: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    whiteSpace: "nowrap" as const,
    color: "#0f172a",
  };
  if (s === "COMPLETED") return { ...base, background: "rgba(34,197,94,0.14)" };
  if (s === "IN_PROGRESS") return { ...base, background: "rgba(59,130,246,0.14)" };
  if (s === "STARTED") return { ...base, background: "rgba(99,102,241,0.14)" };
  if (s === "CANCELLED") return { ...base, background: "rgba(100,116,139,0.16)" };
  return { ...base, background: "rgba(245,158,11,0.16)" };
}

/** ✅ Pro-grade stat tiles: bold + larger fonts */
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
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 35%, rgba(255,255,255,0.16), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 13, opacity: 0.95, fontWeight: 1100, letterSpacing: 0.3 }}>
          {label}
        </div>
        <div style={{ marginTop: 12, fontSize: 34, fontWeight: 1200, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92, fontWeight: 1000 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

export default function FuelReportPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId: rawCompanyId } = React.use(params);
  const companyId = useMemo(() => String(rawCompanyId ?? "").trim(), [rawCompanyId]);

  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);
  const hrefHub = useMemo(() => `${base}`, [base]);
  const hrefTrips = useMemo(() => `${base}/tracking`, [base]);
  const hrefDriver = useMemo(() => `${base}/driver`, [base]);

  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    setSelectedTripIds(parseTripIdsParam(url.searchParams.get("tripIds")));
  }, []);

  // Filters
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState<number>(200);

  // Data
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState<FuelApiResponse | null>(null);

  async function loadReport() {
    if (!companyId) return;

    setLoading(true);
    setNotice(null);

    try {
      const url = new URL(
        `/api/portal/tracking/${companyId}/reports/fuel`,
        window.location.origin
      );

      if (from.trim()) url.searchParams.set("from", from.trim());
      if (to.trim()) url.searchParams.set("to", to.trim());
      if (status.trim()) url.searchParams.set("status", status.trim().toUpperCase());
      url.searchParams.set("limit", String(clampLimit(limit, 1, 500)));

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(json?.error ?? `Failed (${res.status})`);

      const filtered: FuelApiResponse = {
        ...(json as FuelApiResponse),
        rows:
          selectedTripIds.length > 0
            ? (json.rows ?? []).filter(
                (r: FuelRow) => !!r?.tripId && selectedTripIds.includes(r.tripId)
              )
            : (json.rows ?? []),
      };

      if (selectedTripIds.length > 0) {
        const fuelUsedLitersSum = filtered.rows.reduce(
          (acc, r) => acc + (typeof r.totalFuelUsedLiters === "number" ? r.totalFuelUsedLiters : 0),
          0
        );
        const extraCostSum = filtered.rows.reduce(
          (acc, r) => acc + (typeof r.totalExtraCost === "number" ? r.totalExtraCost : 0),
          0
        );
        const flagsCount = filtered.rows.reduce((acc, r) => acc + (r.fuelFlags?.length ?? 0), 0);
        const flagsBreakdown = filtered.rows.reduce<Record<string, number>>((acc, r) => {
          for (const f of r.fuelFlags ?? []) acc[f] = (acc[f] ?? 0) + 1;
          return acc;
        }, {});

        filtered.totals = {
          ...filtered.totals,
          tripCount: filtered.rows.length,
          fuelUsedLitersSum,
          extraCostSum,
          flagsCount,
          flagsBreakdown,
        };
      }

      setData(filtered);
    } catch (e: any) {
      setNotice(e?.message ?? "Failed to load fuel report");
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

    const metaLines: string[] =
      selectedTripIds.length > 0
        ? [
            `Company: ${data.companyId}`,
            `Selected trips: ${selectedTripIds.length}`,
            `Exported: ${new Date().toLocaleString()}`,
          ]
        : [
            `Company: ${data.companyId}`,
            `Range: ${data.range.from} → ${data.range.to}`,
            `Trips: ${data.totals.tripCount}`,
            `Exported: ${new Date().toLocaleString()}`,
          ];

    const columns: ExportColumn[] = [
      { key: "tripId", header: "Trip ID" },
      { key: "status", header: "Status" },
      { key: "truckPlate", header: "Truck" },
      { key: "driverName", header: "Driver" },
      { key: "route", header: "Route" },
      { key: "totalFuelUsedLiters", header: "Fuel Used (L)" },
      { key: "totalExtraCost", header: "Extra Cost" },
      { key: "lastFuelGaugePercent", header: "Last Fuel (%)" },
      { key: "lastFuelGaugeDate", header: "Fuel Gauge Date" },
      { key: "updatedDate", header: "Updated" },
      { key: "fuelFlags", header: "Flags" },
    ];

    const rows: Record<string, any>[] = (data.rows ?? []).map((r) => ({
      ...r,
      fuelFlags: (r.fuelFlags ?? []).join(", "),
      totalFuelUsedLiters: typeof r.totalFuelUsedLiters === "number" ? r.totalFuelUsedLiters : "",
      totalExtraCost: typeof r.totalExtraCost === "number" ? r.totalExtraCost : "",
      lastFuelGaugePercent: typeof r.lastFuelGaugePercent === "number" ? r.lastFuelGaugePercent : "",
    }));

    const payload: ExportPayload = {
      title: `Fuel Report - ${data.companyId}`,
      meta: metaLines,
      columns,
      rows,
    };

    const toExcel = exportToExcel as unknown as (p: ExportPayload) => void;
    const toPdf = exportToPdf as unknown as (p: ExportPayload) => void;

    if (kind === "excel") toExcel(payload);
    else toPdf(payload);
  }

  if (!companyId) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ fontWeight: 1000 }}>
          Missing companyId.{" "}
          <Link href="/portal/tracking" style={{ fontWeight: 1000 }}>
            ← Back to Workspaces
          </Link>
        </div>
      </main>
    );
  }

  const tripCount = data?.totals?.tripCount ?? 0;
  const fuelSum = data?.totals?.fuelUsedLitersSum ?? 0;
  const extraSum = data?.totals?.extraCostSum ?? 0;
  const flagsCount = data?.totals?.flagsCount ?? 0;
  const rows = data?.rows ?? [];

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
              <span style={pillStyle("rgba(255,255,255,0.18)")}>TRACKING · PHASE 4</span>

              <div style={{ marginTop: 10, fontSize: 58, fontWeight: 1200, lineHeight: 1.02 }}>
                Fuel Report
              </div>

              <div style={{ marginTop: 10, fontSize: 16, opacity: 0.92, fontWeight: 900 }}>
                Showing latest by date range (default: last 30 days).
                {selectedTripIds.length > 0 ? ` Selected trips: ${selectedTripIds.length}.` : ""}
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

                {/* Export buttons (multicolor, bold) */}
                <button
                  onClick={() => exportRows("excel")}
                  disabled={!data || loading}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.24)",
                    fontWeight: 1200,
                    fontSize: 14,
                    letterSpacing: 0.2,
                    color: "white",
                    background: "linear-gradient(135deg, #22c55e 0%, #10b981 55%, #14b8a6 100%)",
                    boxShadow: "0 16px 30px rgba(0,0,0,0.18)",
                    cursor: !data || loading ? "not-allowed" : "pointer",
                    opacity: !data || loading ? 0.6 : 1,
                  }}
                >
                  Export Excel
                </button>

                <button
                  onClick={() => exportRows("pdf")}
                  disabled={!data || loading}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.24)",
                    fontWeight: 1200,
                    fontSize: 14,
                    letterSpacing: 0.2,
                    color: "white",
                    background: "linear-gradient(135deg, #f97316 0%, #f59e0b 55%, #ef4444 100%)",
                    boxShadow: "0 16px 30px rgba(0,0,0,0.18)",
                    cursor: !data || loading ? "not-allowed" : "pointer",
                    opacity: !data || loading ? 0.6 : 1,
                  }}
                >
                  Export PDF
                </button>
              </div>

              {/* ✅ FIX: middle “white box” visibility (inputs are white → text is dark + placeholders dark) */}
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
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="From (DD-MM-YYYY)"
                  style={{
                    width: 210,
                    padding: 13,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 1100,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.98)",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="To (DD-MM-YYYY)"
                  style={{
                    width: 210,
                    padding: 13,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 1100,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.98)",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Status (optional)"
                  style={{
                    width: 220,
                    padding: 13,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 1100,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.98)",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
                <input
                  value={String(limit)}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  placeholder="Limit"
                  inputMode="numeric"
                  style={{
                    width: 120,
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
                <button
                  onClick={loadReport}
                  disabled={loading}
                  style={{
                    padding: "13px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "white",
                    color: "#0f172a",
                    fontWeight: 1200,
                    fontSize: 14,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Apply
                </button>

                <style jsx>{`
                  input::placeholder {
                    color: rgba(15, 23, 42, 0.6);
                    font-weight: 1000;
                  }
                `}</style>
              </div>

              {/* ✅ Pro colorful tiles */}
              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <ProStatTile
                  label="Trips"
                  value={String(tripCount)}
                  sub={`Company: ${companyId}`}
                  gradient="linear-gradient(135deg, rgba(20,184,166,0.85), rgba(59,130,246,0.55))"
                />
                <ProStatTile
                  label="Fuel Used (L)"
                  value={fmtNum(fuelSum)}
                  sub="Sum of trip totals"
                  gradient="linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.55))"
                />
                <ProStatTile
                  label="Extra Cost"
                  value={fmtNum(extraSum)}
                  sub="Sum of extra costs"
                  gradient="linear-gradient(135deg, rgba(249,115,22,0.88), rgba(236,72,153,0.55))"
                />
                <ProStatTile
                  label="Flags"
                  value={fmtNum(flagsCount)}
                  sub="Fuel rules flags"
                  gradient="linear-gradient(135deg, rgba(99,102,241,0.88), rgba(124,58,237,0.55))"
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

      {/* Colorful “real” table */}
      <section style={{ padding: "0 18px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 1200, color: "#0f172a" }}>Trips</div>
            <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 950, fontSize: 15 }}>
              Showing latest trips (sorted by updatedAt).
            </div>

            <div style={{ marginTop: 14, overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 980,
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(245,158,11,0.30), rgba(59,130,246,0.22), rgba(124,58,237,0.20))",
                    }}
                  >
                    {["Trip", "Status", "Truck", "Driver", "Route", "Fuel (L)", "Extra", "Flags"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: 14,
                            textAlign: "left",
                            fontSize: 12,
                            letterSpacing: 0.35,
                            color: "rgba(15,23,42,0.88)",
                            fontWeight: 1200,
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 16, fontWeight: 1000, opacity: 0.85 }}>
                        {loading ? "Loading…" : "No rows."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => {
                      const zebra =
                        idx % 2 === 0 ? "rgba(14,165,233,0.06)" : "rgba(99,102,241,0.05)";
                      return (
                        <tr key={r.tripId} style={{ background: zebra }}>
                          <td style={{ padding: 14, fontWeight: 1200, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {String(r.tripId ?? "").slice(0, 8)}…
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={statusChip(r.status)}>{r.status}</span>
                          </td>
                          <td style={{ padding: 14, fontWeight: 1100, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {r.truckPlate}
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {r.driverName}
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 1100 }}>
                            {r.route}
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {fmtNum(r.totalFuelUsedLiters ?? 0)}
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {fmtNum(r.totalExtraCost ?? 0)}
                          </td>
                          <td style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 950 }}>
                            {(r.fuelFlags?.length ?? 0) === 0 ? "—" : (r.fuelFlags ?? []).join(", ")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75, fontWeight: 950 }}>
              Tip: Use Trips Dashboard checkboxes → <b>“Run Fuel Report (selected)”</b>.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}