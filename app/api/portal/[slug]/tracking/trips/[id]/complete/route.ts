// app/api/portal/[slug]/tracking/trips/[id]/complete/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

type TripCheckIn = {
  id: string;
  at: string; // ISO
  currentCity: string;
  note?: string;
  fuelUsed?: number;
  extraCost?: number;
  fuelGaugePercent?: number; // 0..100
};

type TripDoc = {
  tenantSlug?: string;

  status?: TripStatus;

  truckPlate?: string;
  driverName?: string;

  startCity?: string;
  destinationCity?: string;

  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;

  checkIns?: TripCheckIn[];

  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;

  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  fuelFlags?: FuelFlag[];
  fuelFlagsUpdatedAt?: string;

  updatedAt?: string;

  report?: any;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function sumFinite(values: Array<number | undefined>): number | undefined {
  let total = 0;
  for (const v of values) {
    if (isFiniteNumber(v)) total += v;
  }
  return total > 0 ? total : undefined;
}

/** Remove undefined keys so Firestore update() won't choke or overwrite unintentionally */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Phase 4 fuel rules (persisted flags)
 * Assumes checkIns are newest-first (your check-in API prepends).
 */
function computeFuelFlags(checkIns: TripCheckIn[]): FuelFlag[] {
  const flags = new Set<FuelFlag>();

  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return [];
  }

  const latest = checkIns[0];
  const prev = checkIns[1];

  // 1) Missing fuel gauge on latest check-in
  if (!isFiniteNumber(latest?.fuelGaugePercent)) {
    flags.add("MISSING_FUEL_GAUGE");
  }

  // 2) Fuel gauge increased vs previous check-in (possible refuel or misreport)
  if (
    isFiniteNumber(latest?.fuelGaugePercent) &&
    isFiniteNumber(prev?.fuelGaugePercent) &&
    (latest.fuelGaugePercent as number) > (prev.fuelGaugePercent as number)
  ) {
    flags.add("FUEL_GAUGE_INCREASED");
  }

  // 3) Very high fuel used in a single check-in (simple MVP threshold)
  if (isFiniteNumber(latest?.fuelUsed) && (latest.fuelUsed as number) >= 200) {
    flags.add("VERY_HIGH_FUEL_USED_SINGLE_CHECKIN");
  }

  return Array.from(flags);
}

/**
 * Finds newest check-in (from newest-first list) that has a valid gauge reading
 */
function findNewestGauge(checkIns: TripCheckIn[]) {
  const entry = checkIns.find((c) => isFiniteNumber(c?.fuelGaugePercent));
  if (!entry) return { lastFuelGaugePercent: undefined, lastFuelGaugeAt: undefined };
  return {
    lastFuelGaugePercent: entry.fuelGaugePercent,
    lastFuelGaugeAt: entry.at,
  };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const adminDb = getAdminDb();

    const tripRef = adminDb
      .collection("companies")
      .doc(slug)
      .collection("trips")
      .doc(id);

    const snap = await tripRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = snap.data() as TripDoc;
    const status = trip.status;

    // ✅ Idempotent: already completed => return ok + existing report (if any)
    if (status === "COMPLETED") {
      return NextResponse.json({
        ok: true,
        status: "COMPLETED",
        completedAt: trip.completedAt ?? null,
        report: trip.report ?? null,
        idempotent: true,
      });
    }

    // Only STARTED / IN_PROGRESS can complete
    const allowed: TripStatus[] = ["STARTED", "IN_PROGRESS"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Trip cannot be completed from status: ${status ?? "UNKNOWN"}` },
        { status: 409 }
      );
    }

    const checkIns = Array.isArray(trip.checkIns) ? trip.checkIns : [];
    if (checkIns.length === 0) {
      return NextResponse.json(
        { error: "Please submit at least one check-in before completing the trip." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Recompute totals from checkIns (defensive)
    const totalFuelUsedLiters = sumFinite(checkIns.map((c) => c.fuelUsed));
    const totalExtraCost = sumFinite(checkIns.map((c) => c.extraCost));

    // Recompute newest gauge (defensive)
    const { lastFuelGaugePercent, lastFuelGaugeAt } = findNewestGauge(checkIns);

    // Phase 4 flags (persisted)
    const fuelFlags = computeFuelFlags(checkIns);

    // Build report snapshot (Phase 4 deliverable)
    const report = stripUndefined({
      generatedAt: now,
      tripId: id,
      tenantSlug: slug,

      status: "COMPLETED" as TripStatus,

      truckPlate: trip.truckPlate,
      driverName: trip.driverName,

      startCity: trip.startCity,
      destinationCity: trip.destinationCity,

      assignedAt: trip.assignedAt,
      startedAt: trip.startedAt,
      completedAt: now,

      checkInCount: checkIns.length,

      lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent) ? lastFuelGaugePercent : undefined,
      lastFuelGaugeAt: typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,

      totalFuelUsedLiters,
      totalExtraCost,

      fuelFlags,
    });

    await tripRef.update(
      stripUndefined({
        status: "COMPLETED" as TripStatus,
        completedAt: now,
        updatedAt: now,

        // Keep summary fields consistent
        totalFuelUsedLiters,
        totalExtraCost,
        lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent) ? lastFuelGaugePercent : undefined,
        lastFuelGaugeAt: typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,

        // ✅ Persisted fuel flags
        fuelFlags,
        fuelFlagsUpdatedAt: now,

        // ✅ Snapshot
        report,
      })
    );

    return NextResponse.json({
      ok: true,
      status: "COMPLETED",
      completedAt: now,
      fuelFlags,
      report,
    });
  } catch (err: unknown) {
    console.error("TRIP COMPLETE ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to complete trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}