// app/api/portal/[slug]/tracking/reports/fuel/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * =========================================================
 * PHASE 4 · FUEL REPORTS (Dispatcher)
 * =========================================================
 *
 * GET /api/portal/[slug]/tracking/reports/fuel
 *
 * Firestore path (platform structure):
 *  companies/{slug}/trips
 *
 * What it does (MVP):
 *  - Reads trips for a company and returns fuel-focused report rows
 *  - Supports date filtering via query params
 *  - Formats dates in Ethiopian style: DD-MM-YYYY (response only)
 *
 * Query params:
 *  - from: "DD-MM-YYYY"  (optional)
 *  - to:   "DD-MM-YYYY"  (optional)
 *  - status: "ASSIGNED|STARTED|IN_PROGRESS|COMPLETED|CANCELLED" (optional)
 *  - limit: number (optional, default 200, max 500)
 *
 * Notes:
 *  - We filter by updatedAt (ISO) because it reflects latest activity.
 *  - If your trips don’t always have updatedAt, we fallback to assignedAt in code.
 *  - If Firestore requires an index for orderBy/where, it will tell you in error output.
 * =========================================================
 */

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

type TripDoc = {
  status?: TripStatus;

  truckPlate?: string;
  driverName?: string;

  startCity?: string;
  destinationCity?: string;

  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;

  // Phase 4
  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;

  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  fuelFlags?: FuelFlag[];
};

function isIso(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s);
}

function formatDDMMYYYY(iso?: string) {
  if (!iso || !isIso(iso)) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function parseDDMMYYYY(s: string): Date | null {
  // expects "DD-MM-YYYY"
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return null;
  if (yyyy < 1970 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
  // validate round-trip
  if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd) return null;
  return d;
}

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function clampLimit(v: unknown, def = 200) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : def;
  if (!Number.isFinite(n)) return def;
  return Math.max(1, Math.min(500, Math.floor(n)));
}

function asStatus(v: unknown): TripStatus | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().toUpperCase();
  const allowed: TripStatus[] = ["ASSIGNED", "STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  return allowed.includes(s as TripStatus) ? (s as TripStatus) : undefined;
}

function asFiniteNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function sum(nums: Array<number | undefined>) {
  let t = 0;
  for (const n of nums) {
    if (typeof n === "number" && Number.isFinite(n)) t += n;
  }
  return t;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const url = new URL(req.url);
    const fromQ = url.searchParams.get("from") ?? undefined; // DD-MM-YYYY
    const toQ = url.searchParams.get("to") ?? undefined; // DD-MM-YYYY
    const statusQ = asStatus(url.searchParams.get("status") ?? undefined);
    const limit = clampLimit(url.searchParams.get("limit") ?? undefined, 200);

    // Default range: last 30 days (UTC)
    const now = new Date();
    const defaultTo = endOfDayUtc(now);
    const defaultFrom = startOfDayUtc(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30)));

    const fromD = fromQ ? parseDDMMYYYY(fromQ) : null;
    const toD = toQ ? parseDDMMYYYY(toQ) : null;

    const from = fromD ? startOfDayUtc(fromD) : defaultFrom;
    const to = toD ? endOfDayUtc(toD) : defaultTo;

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    // Query by updatedAt (recommended for dashboards)
    // If updatedAt is missing on some docs, we still filter again in code using fallback key.
    let q: FirebaseFirestore.Query = adminDb
      .collection("companies")
      .doc(slug)
      .collection("trips")
      .where("updatedAt", ">=", fromIso)
      .where("updatedAt", "<=", toIso);

    if (statusQ) q = q.where("status", "==", statusQ);

    // orderBy on updatedAt (works with the range filter)
    q = q.orderBy("updatedAt", "desc").limit(limit);

    const snap = await q.get();

    const rows = snap.docs
      .map((doc) => {
        const t = doc.data() as TripDoc;

        const updatedAt = isIso(t.updatedAt) ? t.updatedAt : undefined;
        const assignedAt = isIso(t.assignedAt) ? t.assignedAt : undefined;

        // fallback sort/display key
        const keyIso = updatedAt ?? assignedAt ?? "";

        return {
          tripId: doc.id,
          status: t.status ?? "ASSIGNED",

          truckPlate: t.truckPlate ?? "-",
          driverName: t.driverName ?? "-",
          route: `${t.startCity ?? "-"} → ${t.destinationCity ?? "-"}`,

          // Ethiopian-style date strings (DD-MM-YYYY)
          assignedDate: formatDDMMYYYY(assignedAt),
          updatedDate: formatDDMMYYYY(updatedAt),
          startedDate: formatDDMMYYYY(t.startedAt),
          completedDate: formatDDMMYYYY(t.completedAt),
          lastFuelGaugeDate: formatDDMMYYYY(t.lastFuelGaugeAt),

          // Fuel summary
          lastFuelGaugePercent: asFiniteNumber(t.lastFuelGaugePercent),
          totalFuelUsedLiters: asFiniteNumber(t.totalFuelUsedLiters),
          totalExtraCost: asFiniteNumber(t.totalExtraCost),

          // Flags
          fuelFlags: Array.isArray(t.fuelFlags) ? t.fuelFlags : [],

          // internal key to allow extra filtering/sorting in code if needed
          _keyIso: keyIso,
        };
      })
      // Defensive: ensure the key is within range even if updatedAt missing (fallback to assignedAt)
      .filter((r) => {
        if (!r._keyIso || !isIso(r._keyIso)) return true;
        return r._keyIso >= fromIso && r._keyIso <= toIso;
      });

    // Aggregates
    const totals = {
      tripCount: rows.length,
      fuelUsedLitersSum: sum(rows.map((r) => r.totalFuelUsedLiters)),
      extraCostSum: sum(rows.map((r) => r.totalExtraCost)),
      flagsCount: rows.reduce((acc, r) => acc + (Array.isArray(r.fuelFlags) ? r.fuelFlags.length : 0), 0),
      flagsBreakdown: rows.reduce<Record<string, number>>((acc, r) => {
        for (const f of r.fuelFlags ?? []) acc[f] = (acc[f] ?? 0) + 1;
        return acc;
      }, {}),
    };

    // Remove internal key before returning
    const cleanRows = rows.map(({ _keyIso, ...rest }) => rest);

    return NextResponse.json({
      companyId: slug,
      range: {
        from: formatDDMMYYYY(fromIso),
        to: formatDDMMYYYY(toIso),
        fromIso,
        toIso,
      },
      filters: {
        status: statusQ ?? null,
        limit,
      },
      totals,
      rows: cleanRows,
    });
  } catch (err: any) {
    console.error("FUEL REPORT GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load fuel report" },
      { status: 500 }
    );
  }
}