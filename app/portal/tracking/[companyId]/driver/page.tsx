"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripDetails = {
  tripId: string;
  status: TripStatus;
  startCity: string;
  destinationCity: string;
  truckPlate: string;
  driverName: string;
};

// =========================================================
// Helpers
// =========================================================
function normalizeCode(input: string) {
  return String(input).trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Read ?code= from URL
 * Example:
 * /portal/tracking/INARI/driver?code=A05012
 */
function getQueryParam(name: string) {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
}

// =========================================================
// UI Components
// =========================================================
function StepCard({
  title,
  subtitle,
  icon,
  gradient,
  action,
  disabled,
  buttonLabel,
}: {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  action?: () => void;
  disabled?: boolean;
  buttonLabel?: string;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 18,
        color: "white",
        background: gradient,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.10)",
        minHeight: 140,
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        alignItems: "stretch",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 1100 }}>{title}</div>
        <div
          style={{
            fontSize: 14,
            opacity: 0.92,
            fontWeight: 800,
            lineHeight: 1.45,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </div>

        {action ? (
          <button
            onClick={action}
            disabled={disabled}
            style={{
              marginTop: 8,
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.25)",
              background: disabled
                ? "rgba(255,255,255,0.18)"
                : "rgba(255,255,255,0.22)",
              color: "white",
              fontWeight: 1100,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {buttonLabel ?? "Run"}
          </button>
        ) : null}
      </div>

      <div
        style={{
          width: 66,
          height: 66,
          borderRadius: 18,
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.22)",
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          fontSize: 30,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

/**
 * Robust API caller:
 * - Some APIs live under:
 *   /api/portal/tracking/[companyId]/tracking/...
 * - Others may live under:
 *   /api/portal/[companyId]/tracking/...
 */
async function postWithFallback(
  companyId: string,
  pathAfterTracking: string,
  body?: any
) {
  const candidates = [
    `/api/portal/tracking/${companyId}/tracking/${pathAfterTracking}`,
    `/api/portal/${companyId}/tracking/${pathAfterTracking}`,
  ];

  let lastRes: Response | null = null;
  let lastText = "";

  for (const url of candidates) {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    lastRes = res;
    const text = await res.text().catch(() => "");
    lastText = text;

    if (res.ok) {
      try {
        return { ok: true, data: JSON.parse(text) };
      } catch {
        return { ok: true, data: {} };
      }
    }

    if (res.status === 404) continue;

    let msg = `Request failed (${res.status})`;
    try {
      const j = JSON.parse(text);
      msg = j?.error ?? msg;
    } catch {
      // keep generic
    }
    return { ok: false, error: msg, status: res.status };
  }

  const status = lastRes?.status ?? 404;
  return {
    ok: false,
    status,
    error:
      status === 404
        ? `API route not found (404). Tried both:
1) /api/portal/tracking/${companyId}/tracking/${pathAfterTracking}
2) /api/portal/${companyId}/tracking/${pathAfterTracking}`
        : `Request failed (${status})`,
    debugPreview: lastText?.slice(0, 120) ?? "",
  };
}

// =========================================================
// Page
// =========================================================
export default function DriverAccessPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId: rawCompanyId } = React.use(params);
  const companyId = useMemo(
    () => String(rawCompanyId ?? "").trim(),
    [rawCompanyId]
  );
  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);

  const [code, setCode] = useState("");
  const [loadingFind, setLoadingFind] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [trip, setTrip] = useState<TripDetails | null>(null);

  const [currentCity, setCurrentCity] = useState("");
  const [fuelUsed, setFuelUsed] = useState<string>("");
  const [extraCost, setExtraCost] = useState<string>("");
  const [fuelGaugePercent, setFuelGaugePercent] = useState<string>("");
  const [checkinNote, setCheckinNote] = useState("");

  const tripId = trip?.tripId ?? null;

  // =========================================================
  // Step 1: Find Trip
  // =========================================================
  async function findTrip() {
    setNotice(null);
    setTrip(null);

    const normalized = normalizeCode(code);
    if (!normalized) {
      setNotice("Enter trip code.");
      return;
    }

    setLoadingFind(true);
    try {
      const res = await fetch(
        `/api/portal/tracking/${companyId}/tracking/trips/by-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: normalized }),
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error ?? `Trip not found (${res.status})`);
      }

      const t = (data?.trip ?? data) as any;

      setTrip({
        tripId: String(t.tripId ?? t.id ?? ""),
        status: (t.status ?? "ASSIGNED") as TripStatus,
        truckPlate: t.truckPlate ?? "-",
        driverName: t.driverName ?? "-",
        startCity: t.startCity ?? "-",
        destinationCity: t.destinationCity ?? "-",
      });
    } catch (e: unknown) {
      setNotice(e instanceof Error ? e.message : "Trip not found");
    } finally {
      setLoadingFind(false);
    }
  }

  // Auto-load from QR deep link (?code=...)
  useEffect(() => {
    if (!companyId) return;

    const codeFromUrl = getQueryParam("code");
    if (!codeFromUrl) return;

    const normalized = normalizeCode(codeFromUrl);
    if (!normalized) return;

    setCode(normalized);

    const t = setTimeout(() => {
      if (!loadingFind) findTrip();
    }, 60);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // =========================================================
  // Step 2: Start Trip
  // =========================================================
  async function startTrip() {
    if (!tripId) return;
    setNotice(null);

    const r = await postWithFallback(companyId, `trips/${tripId}/start`);
    if (!r.ok) {
      setNotice(r.error ?? "Failed to start trip");
      return;
    }

    setTrip((t) => (t ? { ...t, status: "STARTED" } : t));
    setNotice("✅ Trip started.");
  }

  // =========================================================
  // Step 3: Check-in
  // =========================================================
  async function checkIn() {
    if (!tripId) return;
    setNotice(null);

    if (!currentCity.trim()) {
      setNotice("currentCity is required for check-in.");
      return;
    }

    const body: any = {
      currentCity: currentCity.trim(),
      note: checkinNote.trim() || undefined,
      fuelUsed: fuelUsed.trim() ? Number(fuelUsed.trim()) : undefined,
      extraCost: extraCost.trim() ? Number(extraCost.trim()) : undefined,
      fuelGaugePercent: fuelGaugePercent.trim()
        ? Number(fuelGaugePercent.trim())
        : undefined,
    };

    const r = await postWithFallback(companyId, `trips/${tripId}/check-in`, body);
    if (!r.ok) {
      setNotice(r.error ?? "Failed check-in");
      return;
    }

    const nextStatus = (r.data?.status ?? "IN_PROGRESS") as TripStatus;
    setTrip((t) => (t ? { ...t, status: nextStatus } : t));
    setNotice("✅ Check-in saved.");
  }

  // =========================================================
  // Step 4: Complete Trip
  // =========================================================
  async function completeTrip() {
    if (!tripId) return;
    setNotice(null);

    const r = await postWithFallback(companyId, `trips/${tripId}/complete`);
    if (!r.ok) {
      setNotice(r.error ?? "Failed to complete trip");
      return;
    }

    setTrip((t) => (t ? { ...t, status: "COMPLETED" } : t));
    setNotice("✅ Trip completed.");
  }

  // =========================================================
  // Guard
  // =========================================================
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
        <div style={{ fontSize: 22, fontWeight: 900 }}>
          Missing companyId. Go back and select a workspace.
          <div style={{ marginTop: 12 }}>
            <Link href="/portal/tracking">← Back to Workspaces</Link>
          </div>
        </div>
      </main>
    );
  }

  const canStart = !!tripId && trip?.status === "ASSIGNED";
  const canCheckin =
    !!tripId && (trip?.status === "STARTED" || trip?.status === "IN_PROGRESS");
  const canComplete =
    !!tripId && (trip?.status === "STARTED" || trip?.status === "IN_PROGRESS");

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={{ fontSize: 44, fontWeight: 1100, marginBottom: 8 }}>
              Driver Trip Access
            </h1>

            <div style={{ opacity: 0.8, fontWeight: 900, marginBottom: 14 }}>
              Workspace: {companyId}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <Link href={base} style={{ fontWeight: 900 }}>
                ← Back to Tracking Workspace
              </Link>
              <span style={{ opacity: 0.6 }}>·</span>
              <Link href={`${base}/tracking`} style={{ fontWeight: 900 }}>
                Trips Dashboard
              </Link>
              <span style={{ opacity: 0.6 }}>·</span>
              <Link href={`${base}/reports/fuel`} style={{ fontWeight: 900 }}>
                Fuel Report
              </Link>
            </div>
          </div>

          {trip ? (
            <div
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 18,
                padding: 14,
                minWidth: 320,
              }}
            >
              <div style={{ fontWeight: 1100, marginBottom: 6 }}>
                Current Trip
              </div>
              <div style={{ fontWeight: 900, opacity: 0.9 }}>
                {trip.startCity} → {trip.destinationCity}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                Trip ID: <code>{trip.tripId}</code>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                Status: <b>{trip.status}</b>
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <StepCard
            title="Step 1"
            subtitle="Enter trip code and find your trip."
            icon="🔎"
            gradient="linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
            action={findTrip}
            disabled={loadingFind}
            buttonLabel={loadingFind ? "Searching…" : "Find Trip"}
          />

          <StepCard
            title="Step 2"
            subtitle="Start trip."
            icon="🚦"
            gradient="linear-gradient(135deg, #10b981 0%, #22c55e 45%, #14b8a6 100%)"
            action={startTrip}
            disabled={!canStart}
            buttonLabel="Start Trip"
          />

          <StepCard
            title="Step 3"
            subtitle="Check-in + fuel (STARTED → IN_PROGRESS)."
            icon="⛽"
            gradient="linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)"
            action={checkIn}
            disabled={!canCheckin}
            buttonLabel="Submit Check-in"
          />

          <StepCard
            title="Step 4"
            subtitle="Complete trip (requires at least one check-in)."
            icon="🏁"
            gradient="linear-gradient(135deg, #111827 0%, #374151 55%, #0f172a 100%)"
            action={completeTrip}
            disabled={!canComplete}
            buttonLabel="Complete Trip"
          />
        </div>

        <div
          style={{
            marginTop: 16,
            background: "white",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 1100, marginBottom: 8 }}>
            Find Your Trip
          </div>
          <div style={{ opacity: 0.8, fontWeight: 900, marginBottom: 12 }}>
            Ask your dispatcher for the Trip Code (example: A05012).
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Trip Code"
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                fontSize: 22,
                fontWeight: 1000,
                letterSpacing: 1.2,
                width: 320,
              }}
            />
            <button
              onClick={findTrip}
              disabled={loadingFind}
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.10)",
                fontWeight: 1100,
                cursor: loadingFind ? "not-allowed" : "pointer",
              }}
            >
              {loadingFind ? "Searching…" : "Find Trip"}
            </button>
          </div>

          {notice && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                background: "rgba(245,158,11,0.12)",
                fontWeight: 900,
              }}
            >
              Notice: {notice}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            background: "white",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 1100, marginBottom: 10 }}>
            Step 3 Details (Check-in + Fuel)
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>
                Current City *
              </div>
              <input
                value={currentCity}
                onChange={(e) => setCurrentCity(e.target.value)}
                placeholder="Bishoftu"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 900,
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>
                Fuel Used (L)
              </div>
              <input
                value={fuelUsed}
                onChange={(e) => setFuelUsed(e.target.value)}
                placeholder="20"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 900,
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>
                Extra Cost
              </div>
              <input
                value={extraCost}
                onChange={(e) => setExtraCost(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 900,
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>
                Fuel Gauge (%)
              </div>
              <input
                value={fuelGaugePercent}
                onChange={(e) => setFuelGaugePercent(e.target.value)}
                placeholder="65"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 900,
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Note</div>
              <input
                value={checkinNote}
                onChange={(e) => setCheckinNote(e.target.value)}
                placeholder="Optional note…"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  fontWeight: 900,
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, opacity: 0.75, fontWeight: 800 }}>
            Tip: Step 2 must be started before Step 3 can submit.
          </div>
        </div>
      </div>
    </main>
  );
}