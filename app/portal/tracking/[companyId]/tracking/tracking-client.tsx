"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type TripRow = {
  id: string;
  status: TripStatus;

  truckPlate: string;
  driverName: string;
  route: string;

  loadType: string;
  loadWeight: number | null;

  agreedCost: number | null;

  assignedAt: string | null;
  updatedAt: string | null;

  lastCheckinCity: string | null;
  lastCheckinAt: string | null;

  totalFuelUsedLiters: number | null;
  totalExtraCost: number | null;

  fuelFlags: string[];
};

function money(v: unknown) {
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

function StatusPill({ status }: { status: TripStatus }) {
  const map: Record<TripStatus, { bg: string; label: string }> = {
    ASSIGNED: { bg: "rgba(245,158,11,0.14)", label: "ASSIGNED" },
    STARTED: { bg: "rgba(37,99,235,0.14)", label: "STARTED" },
    IN_PROGRESS: { bg: "rgba(16,185,129,0.14)", label: "IN PROGRESS" },
    COMPLETED: { bg: "rgba(107,114,128,0.14)", label: "COMPLETED" },
    CANCELLED: { bg: "rgba(100,116,139,0.14)", label: "CANCELLED" },
  };

  const cfg = map[status] ?? map.ASSIGNED;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: 12,
        border: "1px solid rgba(0,0,0,0.10)",
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function TrackingTripsDashboardClient({ companyId }: { companyId: string }) {
  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);
  const hrefHub = useMemo(() => `${base}`, [base]);
  const hrefDriver = useMemo(() => `${base}/driver`, [base]);
  const hrefFuel = useMemo(() => `${base}/reports/fuel`, [base]);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const [rows, setRows] = useState<TripRow[]>([]);

  // Create form
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  const [truckPlate, setTruckPlate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [startCity, setStartCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [loadType, setLoadType] = useState("");
  const [loadWeight, setLoadWeight] = useState<string>("");
  const [agreedCost, setAgreedCost] = useState<string>("");

  async function loadTrips() {
    if (!companyId) return;
    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/portal/tracking/${companyId}/tracking/trips/list?limit=50`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? `Failed to load trips (${res.status})`);

      setRows(Array.isArray(json?.rows) ? json.rows : []);
    } catch (e: unknown) {
      setRows([]);
      setNotice(e instanceof Error ? e.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function createTrip() {
    setNotice(null);
    setCreatedCode(null);
    setCreatedTripId(null);

    // light validation
    if (!truckPlate.trim()) return setNotice("Truck Plate is required.");
    if (!driverName.trim()) return setNotice("Driver Name is required.");
    if (!startCity.trim()) return setNotice("Start City is required.");
    if (!destinationCity.trim()) return setNotice("Destination City is required.");
    if (!loadType.trim()) return setNotice("Load Type is required.");
    if (!agreedCost.trim() || !Number.isFinite(Number(agreedCost)) || Number(agreedCost) < 0) {
      return setNotice("Agreed Cost must be a valid non-negative number.");
    }

    setCreating(true);
    try {
      const payload: any = {
        truckPlate: truckPlate.trim(),
        driverName: driverName.trim(),
        startCity: startCity.trim(),
        destinationCity: destinationCity.trim(),
        loadType: loadType.trim(),
        agreedCost: Number(agreedCost),
      };

      const lw = loadWeight.trim() ? Number(loadWeight) : undefined;
      if (typeof lw === "number" && Number.isFinite(lw)) payload.loadWeight = lw;

      const res = await fetch(`/api/portal/tracking/${companyId}/tracking/trips/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error ?? `Failed to create trip (${res.status})`);

      setCreatedCode(String(json.tripCode ?? ""));
      setCreatedTripId(String(json.tripId ?? ""));

      // reset form (keep it clean)
      setTruckPlate("");
      setDriverName("");
      setStartCity("");
      setDestinationCity("");
      setLoadType("");
      setLoadWeight("");
      setAgreedCost("");

      await loadTrips();
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Failed to create trip");
    } finally {
      setCreating(false);
    }
  }

  if (!companyId) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 26, fontWeight: 1000 }}>Missing companyId</div>
          <div style={{ marginTop: 10, opacity: 0.8 }}>Go back to Workspaces and select your company.</div>
          <div style={{ marginTop: 16 }}>
            <Link href="/portal/tracking" style={{ fontWeight: 950 }}>
              ← Back to Workspaces
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc 0%,#fff 35%,#f8fafc 100%)" }}>
      {/* Header */}
      <section style={{ padding: "34px 18px 16px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg,#0ea5e9 0%,#2563eb 45%,#7c3aed 100%)",
              boxShadow: "0 18px 52px rgba(0,0,0,0.10)",
              color: "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 46, fontWeight: 1000, letterSpacing: 0.2 }}>Trips Dashboard</div>
                <div style={{ opacity: 0.92 }}>
                  Company: <b>{companyId}</b>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  <Link
                    href={hrefHub}
                    style={{
                      textDecoration: "none",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      color: "white",
                      fontWeight: 950,
                      fontSize: 14,
                    }}
                  >
                    ← Workspace Hub
                  </Link>

                  <Link
                    href={hrefDriver}
                    style={{
                      textDecoration: "none",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      color: "white",
                      fontWeight: 950,
                      fontSize: 14,
                    }}
                  >
                    👤 Driver Flow
                  </Link>

                  <Link
                    href={hrefFuel}
                    style={{
                      textDecoration: "none",
                      padding: "12px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      color: "white",
                      fontWeight: 950,
                      fontSize: 14,
                    }}
                  >
                    ⛽ Fuel Report
                  </Link>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <Link
                  href="/portal/tracking"
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
                  ← Workspaces
                </Link>
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
        </div>
      </section>

      {/* Create Trip */}
      <section style={{ padding: "0 18px 18px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 22,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 1000 }}>Create Trip (Dispatcher)</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8, fontWeight: 900 }}>
              Generates a <b>Trip Code</b> (stored as hash only). Share the code with the driver.
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <input value={truckPlate} onChange={(e) => setTruckPlate(e.target.value)} placeholder="Truck Plate *" style={inputStyle} />
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver Name *" style={inputStyle} />
              <input value={startCity} onChange={(e) => setStartCity(e.target.value)} placeholder="Start City *" style={inputStyle} />
              <input value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="Destination City *" style={inputStyle} />
              <input value={loadType} onChange={(e) => setLoadType(e.target.value)} placeholder="Load Type *" style={inputStyle} />
              <input value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} placeholder="Load Weight (optional)" inputMode="numeric" style={inputStyle} />
              <input value={agreedCost} onChange={(e) => setAgreedCost(e.target.value)} placeholder="Agreed Cost *" inputMode="numeric" style={inputStyle} />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={createTrip} disabled={creating} style={primaryBtnStyle(creating)}>
                {creating ? "Creating…" : "➕ Create Trip"}
              </button>

              <button
                onClick={loadTrips}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {createdCode && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(16,185,129,0.28)",
                  background: "rgba(16,185,129,0.10)",
                  fontWeight: 950,
                }}
              >
                ✅ Trip created.
                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span>
                    Trip Code: <code style={{ fontWeight: 1000, fontSize: 16 }}>{createdCode}</code>
                  </span>
                  <button
                    onClick={async () => {
                      const ok = await copyText(createdCode);
                      setNotice(ok ? "Trip code copied." : "Could not copy trip code.");
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    Copy
                  </button>
                  {createdTripId ? <span style={{ opacity: 0.85 }}>Trip ID: {createdTripId}</span> : null}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Share this Trip Code with the driver to use in Driver Flow.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trips Table */}
      <section style={{ padding: "0 18px 44px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 22,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 1000 }}>Recent Trips</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8, fontWeight: 900 }}>
                  Shows last updated trips (requires updatedAt to be present).
                </div>
              </div>
              <div style={{ fontWeight: 950, opacity: 0.8 }}>{rows.length} trip(s)</div>
            </div>

            {loading ? (
              <div style={{ marginTop: 14, fontSize: 16, fontWeight: 950 }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ marginTop: 14, fontSize: 15, opacity: 0.85 }}>
                No trips yet. Create your first trip above.
              </div>
            ) : (
              <div style={{ marginTop: 14, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      <th style={th}>Status</th>
                      <th style={th}>Truck</th>
                      <th style={th}>Driver</th>
                      <th style={th}>Route</th>
                      <th style={th}>Load</th>
                      <th style={th}>Cost</th>
                      <th style={th}>Last Check-in</th>
                      <th style={th}>Fuel</th>
                      <th style={th}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td style={td}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <StatusPill status={r.status} />
                            <span style={{ fontSize: 12, opacity: 0.75 }}>ID: {r.id.slice(0, 8)}…</span>
                          </div>
                        </td>
                        <td style={tdStrong}>{r.truckPlate}</td>
                        <td style={td}>{r.driverName}</td>
                        <td style={td}>{r.route}</td>
                        <td style={td}>
                          {r.loadType}
                          {typeof r.loadWeight === "number" ? ` · ${r.loadWeight}` : ""}
                        </td>
                        <td style={tdStrong}>{money(r.agreedCost)}</td>
                        <td style={td}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ fontWeight: 950 }}>{r.lastCheckinCity ?? "-"}</div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtIso(r.lastCheckinAt)}</div>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ fontWeight: 950 }}>
                              {r.totalFuelUsedLiters ?? 0} L · {money(r.totalExtraCost ?? 0)}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                              Flags: {Array.isArray(r.fuelFlags) ? r.fuelFlags.length : 0}
                            </div>
                          </div>
                        </td>
                        <td style={td}>{fmtIso(r.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
                  Next improvement: add a Trip Details page (timeline + check-ins) and link from the table.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid #d1d5db",
  fontSize: 15,
  fontWeight: 900,
};

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.10)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 950,
    color: "white",
    background: disabled ? "rgba(148,163,184,0.55)" : "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
    boxShadow: "0 14px 30px rgba(37,99,235,0.18)",
  };
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e7eb",
  padding: 12,
  fontSize: 13,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
  padding: 12,
  fontSize: 14,
  verticalAlign: "top",
};

const tdStrong: React.CSSProperties = {
  ...td,
  fontWeight: 950,
};