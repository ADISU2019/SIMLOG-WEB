// app/api/portal/tracking/[companyId]/reports/fuel/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/portal/tracking/[companyId]/reports/fuel
 *
 * Optional query:
 *   - tripIds: comma-separated trip document IDs
 *     Example: ?tripIds=abc123,def456
 *
 * Default behavior (no tripIds):
 *   - date range + optional status filter using updatedAt
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
  for (const n of nums) if (typeof n === "number" && Number.isFinite(n)) t += n;
  return t;
}

function parseTripIds(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 200);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ companyId: string }> | { companyId: string } }
) {
  try {
    // ✅ Next 16 (Turbopack) can pass params as a Promise
    const resolvedParams = await Promise.resolve(ctx.params);
    const companyId = String(resolvedParams?.companyId ?? "").trim();

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId in URL." },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const url = new URL(req.url);

    // ✅ Selected trips mode
    const tripIds = parseTripIds(url.searchParams.get("tripIds"));

    if (tripIds.length > 0) {
      const col = adminDb.collection("companies").doc(companyId).collection("trips");
      const refs = tripIds.map((id) => col.doc(id));
      const snaps = await adminDb.getAll(...refs);

      const rows = snaps
        .filter((s) => s.exists)
        .map((doc) => {
          const t = doc.data() as TripDoc;

          const updatedAt = isIso(t.updatedAt) ? t.updatedAt : undefined;
          const assignedAt = isIso(t.assignedAt) ? t.assignedAt : undefined;
          const keyIso = updatedAt ?? assignedAt ?? "";

          return {
            tripId: doc.id,
            status: t.status ?? "ASSIGNED",
            truckPlate: t.truckPlate ?? "-",
            driverName: t.driverName ?? "-",
            route: `${t.startCity ?? "-"} → ${t.destinationCity ?? "-"}`,
            assignedDate: formatDDMMYYYY(assignedAt),
            updatedDate: formatDDMMYYYY(updatedAt),
            startedDate: formatDDMMYYYY(t.startedAt),
            completedDate: formatDDMMYYYY(t.completedAt),
            lastFuelGaugeDate: formatDDMMYYYY(t.lastFuelGaugeAt),
            lastFuelGaugePercent: asFiniteNumber(t.lastFuelGaugePercent),
            totalFuelUsedLiters: asFiniteNumber(t.totalFuelUsedLiters),
            totalExtraCost: asFiniteNumber(t.totalExtraCost),
            fuelFlags: Array.isArray(t.fuelFlags) ? t.fuelFlags : [],
            _keyIso: keyIso,
          };
        });

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

      const cleanRows = rows.map(({ _keyIso, ...rest }) => rest);

      return NextResponse.json({
        companyId,
        mode: "selectedTrips",
        selectedTripIds: tripIds,
        totals,
        rows: cleanRows,
      });
    }

    // ✅ Default date-range mode
    const fromQ = url.searchParams.get("from") ?? undefined; // DD-MM-YYYY
    const toQ = url.searchParams.get("to") ?? undefined; // DD-MM-YYYY
    const statusQ = asStatus(url.searchParams.get("status") ?? undefined);
    const limit = clampLimit(url.searchParams.get("limit") ?? undefined, 200);

    const now = new Date();
    const defaultTo = endOfDayUtc(now);
    const defaultFrom = startOfDayUtc(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30))
    );

    const fromD = fromQ ? parseDDMMYYYY(fromQ) : null;
    const toD = toQ ? parseDDMMYYYY(toQ) : null;

    const from = fromD ? startOfDayUtc(fromD) : defaultFrom;
    const to = toD ? endOfDayUtc(toD) : defaultTo;

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    let q: FirebaseFirestore.Query = adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .where("updatedAt", ">=", fromIso)
      .where("updatedAt", "<=", toIso);

    if (statusQ) q = q.where("status", "==", statusQ);

    q = q.orderBy("updatedAt", "desc").limit(limit);

    const snap = await q.get();

    const rows = snap.docs.map((doc) => {
      const t = doc.data() as TripDoc;

      const updatedAt = isIso(t.updatedAt) ? t.updatedAt : undefined;
      const assignedAt = isIso(t.assignedAt) ? t.assignedAt : undefined;

      return {
        tripId: doc.id,
        status: t.status ?? "ASSIGNED",
        truckPlate: t.truckPlate ?? "-",
        driverName: t.driverName ?? "-",
        route: `${t.startCity ?? "-"} → ${t.destinationCity ?? "-"}`,
        assignedDate: formatDDMMYYYY(assignedAt),
        updatedDate: formatDDMMYYYY(updatedAt),
        startedDate: formatDDMMYYYY(t.startedAt),
        completedDate: formatDDMMYYYY(t.completedAt),
        lastFuelGaugeDate: formatDDMMYYYY(t.lastFuelGaugeAt),
        lastFuelGaugePercent: asFiniteNumber(t.lastFuelGaugePercent),
        totalFuelUsedLiters: asFiniteNumber(t.totalFuelUsedLiters),
        totalExtraCost: asFiniteNumber(t.totalExtraCost),
        fuelFlags: Array.isArray(t.fuelFlags) ? t.fuelFlags : [],
      };
    });

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

    return NextResponse.json({
      companyId,
      mode: "dateRange",
      totals,
      rows,
    });
  } catch (err: any) {
    console.error("FUEL REPORT GET ERROR:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load fuel report" }, { status: 500 });
  }
}