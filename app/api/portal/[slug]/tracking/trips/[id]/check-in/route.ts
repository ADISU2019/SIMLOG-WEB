// app/api/portal/[slug]/tracking/trips/[id]/check-in/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

type CheckInBody = {
  currentCity: string;
  note?: string;
  fuelUsed?: number; // liters since last check-in
  extraCost?: number; // cost since last check-in
  fuelGaugePercent?: number; // 0..100
};

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripCheckIn = {
  id: string;
  at: string;
  currentCity: string;
  note?: string;
  fuelUsed?: number;
  extraCost?: number;
  fuelGaugePercent?: number;
};

type TripDoc = {
  status?: TripStatus;
  checkIns?: TripCheckIn[];

  lastCheckinCity?: string;
  lastCheckinAt?: string;

  // Phase 4 summaries
  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;

  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  // Phase 4 flags
  fuelFlags?: FuelFlag[];
  fuelFlagsUpdatedAt?: string;

  updatedAt?: string;
};

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function cleanOptionalText(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function asOptionalNonNegativeNumber(v: unknown): number | undefined {
  if (!isFiniteNumber(v)) return undefined;
  if (v < 0) return undefined;
  return v;
}

function asOptionalPercent(v: unknown): number | undefined {
  if (!isFiniteNumber(v)) return undefined;
  if (v < 0 || v > 100) return undefined;
  return Math.round(v);
}

function sumFinite(values: Array<number | undefined>): number {
  let total = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

/**
 * Fuel rules (hardening)
 * - Missing gauge anywhere -> MISSING_FUEL_GAUGE
 * - Gauge increased between latest and previous (if both exist) -> FUEL_GAUGE_INCREASED
 * - Any single check-in fuelUsed >= VERY_HIGH_FUEL_USED_LITERS -> VERY_HIGH_FUEL_USED_SINGLE_CHECKIN
 */
const VERY_HIGH_FUEL_USED_LITERS = 200;

function computeFuelFlags(checkInsNewestFirst: TripCheckIn[]): FuelFlag[] {
  const flags = new Set<FuelFlag>();

  // Missing gauge on ANY check-in
  if (checkInsNewestFirst.some((c) => c.fuelGaugePercent === undefined)) {
    flags.add("MISSING_FUEL_GAUGE");
  }

  // Gauge increased (compare newest vs previous, if both exist)
  const newest = checkInsNewestFirst[0];
  const prev = checkInsNewestFirst[1];
  if (
    newest &&
    prev &&
    isFiniteNumber(newest.fuelGaugePercent) &&
    isFiniteNumber(prev.fuelGaugePercent) &&
    newest.fuelGaugePercent > prev.fuelGaugePercent
  ) {
    flags.add("FUEL_GAUGE_INCREASED");
  }

  // Very high fuel used in a single check-in
  if (checkInsNewestFirst.some((c) => isFiniteNumber(c.fuelUsed) && c.fuelUsed >= VERY_HIGH_FUEL_USED_LITERS)) {
    flags.add("VERY_HIGH_FUEL_USED_SINGLE_CHECKIN");
  }

  return Array.from(flags);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const adminDb = getAdminDb();

    const body = (await req.json().catch(() => null)) as CheckInBody | null;

    if (!body || typeof body.currentCity !== "string" || !body.currentCity.trim()) {
      return NextResponse.json({ error: "currentCity is required" }, { status: 400 });
    }

    const currentCity = body.currentCity.trim();

    const fuelUsed = asOptionalNonNegativeNumber(body.fuelUsed);
    const extraCost = asOptionalNonNegativeNumber(body.extraCost);
    const fuelGaugePercent = asOptionalPercent(body.fuelGaugePercent);

    const tripRef = adminDb.collection("companies").doc(slug).collection("trips").doc(id);

    const snap = await tripRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const trip = snap.data() as TripDoc;

    const status = trip.status;
    const allowed: TripStatus[] = ["STARTED", "IN_PROGRESS"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot check-in when status is ${status ?? "UNKNOWN"}` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const checkIn: TripCheckIn = {
      id: makeId(),
      at: now,
      currentCity,
      note: cleanOptionalText(body.note),
      fuelUsed,
      extraCost,
      fuelGaugePercent,
    };

    const prevCheckIns = Array.isArray(trip.checkIns) ? trip.checkIns : [];
    const nextCheckIns: TripCheckIn[] = [checkIn, ...prevCheckIns];

    const nextStatus: TripStatus = status === "STARTED" ? "IN_PROGRESS" : status;

    // totals (store 0 if none)
    const totalFuelUsedLiters = sumFinite(nextCheckIns.map((c) => c.fuelUsed));
    const totalExtraCost = sumFinite(nextCheckIns.map((c) => c.extraCost));

    // latest gauge summary: newest check-in with a gauge reading
    const newestGaugeEntry = nextCheckIns.find((c) => isFiniteNumber(c.fuelGaugePercent));
    const lastFuelGaugePercent = newestGaugeEntry?.fuelGaugePercent;
    const lastFuelGaugeAt = newestGaugeEntry?.at;

    // flags (persisted)
    const fuelFlags = computeFuelFlags(nextCheckIns);

    const update: Partial<TripDoc> = {
      checkIns: nextCheckIns,

      lastCheckinCity: currentCity,
      lastCheckinAt: now,

      status: nextStatus,
      updatedAt: now,

      lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent) ? lastFuelGaugePercent : undefined,
      lastFuelGaugeAt: typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,

      totalFuelUsedLiters,
      totalExtraCost,

      fuelFlags,
      fuelFlagsUpdatedAt: now,
    };

    await tripRef.update(update);

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      checkIn,
      summary: {
        lastFuelGaugePercent: update.lastFuelGaugePercent ?? null,
        lastFuelGaugeAt: update.lastFuelGaugeAt ?? null,
        totalFuelUsedLiters,
        totalExtraCost,
        fuelFlags,
      },
    });
  } catch (err: unknown) {
    console.error("CHECK-IN ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to submit check-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}