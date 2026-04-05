// app/portal/tracking/[companyId]/timeline/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/**
 * =========================================================
 * TRIP TIMELINE BOARD
 * =========================================================
 * URL:
 *   /portal/tracking/[companyId]/timeline
 *
 * Purpose:
 *  - Dispatcher live view of all trips
 *  - Shows trip lifecycle:
 *      ASSIGNED → STARTED → CHECK-INS → COMPLETED
 *  - Highlights fuel totals, extra cost, flags, last city
 * =========================================================
 */

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

type TripCheckIn = {
  id?: string;
  at?: string | null;
  currentCity?: string | null;
  note?: string | null;
  fuelUsed?: number | null;
  extraCost?: number | null;
  fuelGaugePercent?: number | null;
};

type TripRow = {
  id: string;
  status?: TripStatus | string | null;

  tripType?: string | null;

  truckPlate?: string | null;
  driverName?: string | null;

  startCity?: string | null;
  destinationCity?: string | null;

  loadType?: string | null;
  agreedCost?: number | string | null;

  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;

  lastCheckinCity?: string | null;
  lastCheckinAt?: string | null;

  lastFuelGaugePercent?: number | null;
  lastFuelGaugeAt?: string | null;

  totalFuelUsedLiters?: number | null;
  totalExtraCost?: number | null;

  fuelFlags?: FuelFlag[] | null;
  checkIns?: TripCheckIn[] | null;
};

function safeText(v: unknown, fallback = "-") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function fmtNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
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

function statusPillStyle(status: string) {
  const s = String(status ?? "ASSIGNED").toUpperCase();

  if (s === "COMPLETED") {
    return {
      background: "rgba(34,197,94,0.14)",
      border: "1px solid rgba(34,197,94,0.28)",
      color: "#166534",
    };
  }

  if (s === "IN_PROGRESS") {
    return {
      background: "rgba(20,184,166,0.14)",
      border: "1px solid rgba(20,184,166,0.28)",
      color: "#115e59",
    };
  }

  if (s === "STARTED") {
    return {
      background: "rgba(59,130,246,0.14)",
      border: "1px solid rgba(59,130,246,0.28)",
      color: "#1d4ed8",
    };
  }

  if (s === "CANCELLED") {
    return {
      background: "rgba(100,116,139,0.14)",
      border: "1px solid rgba(100,116,139,0.28)",
      color: "#475569",
    };
  }

  return {
    background: "rgba(245,158,11,0.14)",
    border: "1px solid rgba(245,158,11,0.28)",
    color: "#b45309",
  };
}

function cardGradient(status?: string | null) {
  const s = String(status ?? "ASSIGNED").toUpperCase();

  if (s === "COMPLETED") {
    return "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.08) 100%)";
  }
  if (s === "IN_PROGRESS") {
    return "linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(59,130,246,0.08) 100%)";
  }
  if (s === "STARTED") {
    return "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)";
  }
  if (s === "CANCELLED") {
    return "linear-gradient(135deg, rgba(148,163,184,0.14) 0%, rgba(100,116,139,0.08) 100%)";
  }
  return "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(249,115,22,0.08) 100%)";
}

function StatTile({
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
        flex: "1 1 210px",
        borderRadius: 20,
        padding: 18,
        background: gradient,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
        color: "white",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -30,
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 35%, rgba(255,255,255,0.10), transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.95 }}>{label}</div>
        <div style={{ marginTop: 10, fontSize: 36, fontWeight: 1100, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, opacity: 0.95 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function TimelineNode({
  label,
  value,
  active = true,
  color = "#2563eb",
}: {
  label: string;
  value: string;
  active?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        minWidth: 120,
        display: "grid",
        gap: 8,
        justifyItems: "center",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: active ? color : "#cbd5e1",
          border: "3px solid white",
          boxShadow: active ? `0 0 0 3px ${color}22` : "0 0 0 3px rgba(203,213,225,0.6)",
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 1000, color: "#0f172a", textAlign: "center" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, textAlign: "center" }}>
        {value}
      </div>
    </div>
  );
}

export default function TripTimelineBoardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId: rawCompanyId } = React.use(params);
  const companyId = useMemo(() => String(rawCompanyId ?? "").trim(), [rawCompanyId]);

  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);
  const hrefHub = useMemo(() => `${base}`, [base]);
  const hrefTrips = useMemo(() => `${base}/tracking`, [base]);
  const hrefFuel = useMemo(() => `${base}/reports/fuel`, [base]);
  const hrefTripsReport = useMemo(() => `${base}/reports/trips`, [base]);

  const [rows, setRows] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTrips() {
    if (!companyId) return;

    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch(
        `/api/portal/tracking/${companyId}/tracking/trips/list?limit=100`,
        { cache: "no-store" }
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error ?? `Failed to load trips (${res.status})`);
      }

      const list = Array.isArray(data?.trips)
        ? data.trips
        : Array.isArray(data)
          ? data
          : [];

      const mapped: TripRow[] = list.map((t: any) => ({
        id: String(t?.id ?? t?.tripId ?? "").trim(),
        status: t?.status ?? "ASSIGNED",

        tripType: t?.tripType ?? null,

        truckPlate: t?.truckPlate ?? "-",
        driverName: t?.driverName ?? "-",

        startCity: t?.startCity ?? null,
        destinationCity: t?.destinationCity ?? null,

        loadType: t?.loadType ?? null,
        agreedCost: t?.agreedCost ?? null,

        assignedAt: t?.assignedAt ?? null,
        startedAt: t?.startedAt ?? null,
        completedAt: t?.completedAt ?? null,
        updatedAt: t?.updatedAt ?? null,

        lastCheckinCity: t?.lastCheckinCity ?? null,
        lastCheckinAt: t?.lastCheckinAt ?? null,

        lastFuelGaugePercent: t?.lastFuelGaugePercent ?? null,
        lastFuelGaugeAt: t?.lastFuelGaugeAt ?? null,

        totalFuelUsedLiters: t?.totalFuelUsedLiters ?? null,
        totalExtraCost: t?.totalExtraCost ?? null,

        fuelFlags: Array.isArray(t?.fuelFlags) ? t.fuelFlags : [],
        checkIns: Array.isArray(t?.checkIns) ? t.checkIns : [],
      }));

      mapped.sort((a, b) => {
        const aActive = ["STARTED", "IN_PROGRESS", "ASSIGNED"].includes(
          String(a.status ?? "").toUpperCase()
        )
          ? 1
          : 0;
        const bActive = ["STARTED", "IN_PROGRESS", "ASSIGNED"].includes(
          String(b.status ?? "").toUpperCase()
        )
          ? 1
          : 0;

        if (aActive !== bActive) return bActive - aActive;

        const aTime = new Date(a.updatedAt ?? a.assignedAt ?? 0).getTime();
        const bTime = new Date(b.updatedAt ?? b.assignedAt ?? 0).getTime();

        return bTime - aTime;
      });

      setRows(mapped);
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Failed to load timeline board");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  if (!companyId) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 28, fontWeight: 1100 }}>Missing companyId</div>
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            Go back to Workspaces and select your company.
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/portal/tracking" style={{ fontWeight: 1000 }}>
              ← Back to Workspaces
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const totalTrips = rows.length;
  const assignedCount = rows.filter(
    (r) => String(r.status ?? "").toUpperCase() === "ASSIGNED"
  ).length;
  const inProgressCount = rows.filter((r) =>
    ["STARTED", "IN_PROGRESS"].includes(String(r.status ?? "").toUpperCase())
  ).length;
  const completedCount = rows.filter(
    (r) => String(r.status ?? "").toUpperCase() === "COMPLETED"
  ).length;
  const flaggedCount = rows.filter((r) => (r.fuelFlags?.length ?? 0) > 0).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      {/* HERO */}
      <section style={{ padding: "24px 18px 16px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 30,
              padding: 26,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #7c3aed 100%)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.14)",
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
              <div
                style={{
                  width: "fit-content",
                  padding: "9px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.24)",
                  fontWeight: 1000,
                  fontSize: 13,
                }}
              >
                TRACKING · LIVE OPERATIONS
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 58,
                  fontWeight: 1100,
                  lineHeight: 1.03,
                  letterSpacing: 0.2,
                }}
              >
                Trip Timeline Board
              </div>

              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, opacity: 0.96 }}>
                Dispatcher live control view for assigned, active, and completed trips.
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={hrefHub}
                  style={{
                    textDecoration: "none",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "rgba(17,24,39,0.85)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    color: "white",
                    fontWeight: 1000,
                    fontSize: 14,
                  }}
                >
                  ← Workspace Hub
                </Link>

                <Link
                  href={hrefTrips}
                  style={{
                    textDecoration: "none",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "white",
                    fontWeight: 1000,
                    fontSize: 14,
                  }}
                >
                  Trips Dashboard
                </Link>

                <Link
                  href={hrefFuel}
                  style={{
                    textDecoration: "none",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: 1000,
                    fontSize: 14,
                  }}
                >
                  Fuel Report →
                </Link>

                <Link
                  href={hrefTripsReport}
                  style={{
                    textDecoration: "none",
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: 1000,
                    fontSize: 14,
                  }}
                >
                  Trips Report →
                </Link>

                <button
                  onClick={loadTrips}
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.20)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    color: "white",
                    fontWeight: 1000,
                    fontSize: 14,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <StatTile
                  label="Total Trips"
                  value={fmtNum(totalTrips)}
                  sub={`Company: ${companyId}`}
                  gradient="linear-gradient(135deg, rgba(34,197,94,0.45), rgba(16,185,129,0.35))"
                />
                <StatTile
                  label="Assigned"
                  value={fmtNum(assignedCount)}
                  sub="Waiting to start"
                  gradient="linear-gradient(135deg, rgba(245,158,11,0.55), rgba(249,115,22,0.40))"
                />
                <StatTile
                  label="Active"
                  value={fmtNum(inProgressCount)}
                  sub="Started / in progress"
                  gradient="linear-gradient(135deg, rgba(20,184,166,0.52), rgba(37,99,235,0.32))"
                />
                <StatTile
                  label="Completed"
                  value={fmtNum(completedCount)}
                  sub="Finished trips"
                  gradient="linear-gradient(135deg, rgba(34,197,94,0.55), rgba(22,163,74,0.36))"
                />
                <StatTile
                  label="Flagged"
                  value={fmtNum(flaggedCount)}
                  sub="Fuel/accountability review"
                  gradient="linear-gradient(135deg, rgba(239,68,68,0.52), rgba(236,72,153,0.35))"
                />
              </div>
            </div>
          </div>

          {notice ? (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(245,158,11,0.30)",
                background: "rgba(245,158,11,0.10)",
                fontWeight: 950,
              }}
            >
              Notice: {notice}
            </div>
          ) : null}
        </div>
      </section>

      {/* TIMELINE CARDS */}
      <section style={{ padding: "0 18px 44px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 18 }}>
          {rows.length === 0 ? (
            <div
              style={{
                borderRadius: 26,
                padding: 22,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "white",
                boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
                fontSize: 18,
                fontWeight: 1000,
              }}
            >
              {loading ? "Loading timeline board…" : "No trips found yet."}
            </div>
          ) : (
            rows.map((trip) => {
              const status = String(trip.status ?? "ASSIGNED").toUpperCase();
              const pill = statusPillStyle(status);

              const checkIns = Array.isArray(trip.checkIns) ? trip.checkIns : [];
              const latestCheckIns = [...checkIns]
                .sort((a, b) => {
                  const aTime = new Date(a.at ?? 0).getTime();
                  const bTime = new Date(b.at ?? 0).getTime();
                  return aTime - bTime;
                })
                .slice(0, 4);

              return (
                <div
                  key={trip.id}
                  style={{
                    borderRadius: 28,
                    padding: 22,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: cardGradient(status),
                    boxShadow: "0 18px 42px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* TOP */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 10 }}>
                      <div
                        style={{
                          fontSize: 34,
                          fontWeight: 1100,
                          color: "#0f172a",
                          lineHeight: 1.08,
                        }}
                      >
                        {safeText(trip.startCity)} → {safeText(trip.destinationCity)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderRadius: 999,
                            fontWeight: 1000,
                            fontSize: 14,
                            ...pill,
                          }}
                        >
                          {status}
                        </span>

                        <span
                          style={{
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.65)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            fontWeight: 1000,
                            fontSize: 14,
                            color: "#0f172a",
                          }}
                        >
                          Truck: {safeText(trip.truckPlate)}
                        </span>

                        <span
                          style={{
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.65)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            fontWeight: 1000,
                            fontSize: 14,
                            color: "#0f172a",
                          }}
                        >
                          Driver: {safeText(trip.driverName)}
                        </span>

                        <span
                          style={{
                            padding: "10px 14px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.65)",
                            border: "1px solid rgba(0,0,0,0.08)",
                            fontWeight: 1000,
                            fontSize: 14,
                            color: "#0f172a",
                          }}
                        >
                          Type: {safeText(trip.tripType, "ONE_WAY")}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: 280,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 18,
                          padding: 16,
                          background: "rgba(255,255,255,0.72)",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.72 }}>
                          Trip ID
                        </div>
                        <div style={{ marginTop: 8, fontSize: 16, fontWeight: 1000 }}>
                          <code>{trip.id}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIMELINE */}
                  <div
                    style={{
                      marginTop: 18,
                      borderRadius: 24,
                      padding: 18,
                      background: "rgba(255,255,255,0.68)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      overflowX: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 0,
                        minWidth: 760,
                      }}
                    >
                      <TimelineNode
                        label="ASSIGNED"
                        value={fmtIso(trip.assignedAt)}
                        active={!!trip.assignedAt}
                        color="#f59e0b"
                      />

                      <div
                        style={{
                          height: 4,
                          width: 56,
                          marginTop: 7,
                          background: trip.startedAt ? "#3b82f6" : "#cbd5e1",
                          borderRadius: 999,
                          flex: "0 0 auto",
                        }}
                      />

                      <TimelineNode
                        label="STARTED"
                        value={fmtIso(trip.startedAt)}
                        active={!!trip.startedAt}
                        color="#2563eb"
                      />

                      {latestCheckIns.map((c, idx) => (
                        <React.Fragment key={c.id ?? `${trip.id}-${idx}`}>
                          <div
                            style={{
                              height: 4,
                              width: 56,
                              marginTop: 7,
                              background: "#14b8a6",
                              borderRadius: 999,
                              flex: "0 0 auto",
                            }}
                          />
                          <TimelineNode
                            label={`CHECK-IN ${idx + 1}`}
                            value={safeText(c.currentCity)}
                            active={true}
                            color="#14b8a6"
                          />
                        </React.Fragment>
                      ))}

                      <div
                        style={{
                          height: 4,
                          width: 56,
                          marginTop: 7,
                          background: trip.completedAt ? "#22c55e" : "#cbd5e1",
                          borderRadius: 999,
                          flex: "0 0 auto",
                        }}
                      />

                      <TimelineNode
                        label="COMPLETED"
                        value={fmtIso(trip.completedAt)}
                        active={!!trip.completedAt}
                        color="#22c55e"
                      />
                    </div>
                  </div>

                  {/* BOTTOM STATS */}
                  <div
                    style={{
                      marginTop: 18,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 18,
                        padding: 16,
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 1000 }}>
                        Last City
                      </div>
                      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1100 }}>
                        {safeText(trip.lastCheckinCity, safeText(trip.startCity))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.76, fontWeight: 900 }}>
                        Last update: {fmtIso(trip.updatedAt ?? trip.lastCheckinAt)}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 18,
                        padding: 16,
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 1000 }}>
                        Fuel Used (L)
                      </div>
                      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1100 }}>
                        {fmtNum(trip.totalFuelUsedLiters ?? 0)}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.76, fontWeight: 900 }}>
                        Last gauge: {trip.lastFuelGaugePercent ?? "-"}%
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 18,
                        padding: 16,
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 1000 }}>
                        Extra Cost
                      </div>
                      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1100 }}>
                        {money(trip.totalExtraCost ?? 0)}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.76, fontWeight: 900 }}>
                        Agreed cost: {money(trip.agreedCost)}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 18,
                        padding: 16,
                        background: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 1000 }}>
                        Fuel Flags
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {(trip.fuelFlags?.length ?? 0) === 0 ? (
                          <span
                            style={{
                              padding: "8px 12px",
                              borderRadius: 999,
                              border: "1px solid rgba(34,197,94,0.30)",
                              background: "rgba(34,197,94,0.10)",
                              fontWeight: 1000,
                              fontSize: 13,
                              color: "#166534",
                            }}
                          >
                            No flags
                          </span>
                        ) : (
                          (trip.fuelFlags ?? []).map((flag, idx) => (
                            <span
                              key={`${trip.id}-flag-${idx}`}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(239,68,68,0.30)",
                                background: "rgba(239,68,68,0.10)",
                                fontWeight: 1000,
                                fontSize: 12,
                                color: "#b91c1c",
                              }}
                            >
                              {flag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}