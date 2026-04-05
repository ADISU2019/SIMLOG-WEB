// app/api/portal/[slug]/tracking/trips/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { Trip } from "@/types/trip";
import crypto from "crypto";

/**
 * =========================================================
 * TRIPS API (PHASE 2 + Phase 3/4 compatible)
 * =========================================================
 *
 * GET  /api/portal/[slug]/tracking/trips
 * POST /api/portal/[slug]/tracking/trips
 *
 * Firestore paths (platform structure):
 *  companies/{slug}/trips
 *  companies/{slug}/trucks
 *  companies/{slug}/drivers
 * =========================================================
 */

type CreateTripBody = {
  truckId: string;
  driverId: string;

  startCity: string;
  destinationCity: string;

  agreedCost: number;
  loadType: string;
  loadWeight?: number;

  plannedFuel?: number;
  plannedDistanceKm?: number;
  plannedDurationHours?: number;

  etDay: number; // 1..30
  etMonth: number; // 1..13

  notes?: string;
};

/** -----------------------------
 * Helpers
 * ------------------------------ */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isValidEtDay(day: unknown) {
  return Number.isInteger(day) && (day as number) >= 1 && (day as number) <= 30;
}

function isValidEtMonth(month: unknown) {
  return (
    Number.isInteger(month) && (month as number) >= 1 && (month as number) <= 13
  );
}

/**
 * Accept numbers OR numeric strings. Return undefined if invalid.
 */
function asOptionalNumber(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Remove undefined values (Firestore cannot store undefined).
 */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

/**
 * Defensive: normalize a Trip doc for UI.
 */
function normalizeTripForUi(raw: any) {
  const t: any = { ...(raw ?? {}) };

  // Normalize checkIns array
  if (Array.isArray(t.checkIns)) {
    t.checkIns = t.checkIns.map((c: any) => ({
      ...c,
      fuelUsed: asOptionalNumber(c?.fuelUsed),
      extraCost: asOptionalNumber(c?.extraCost),
      fuelGaugePercent: asOptionalNumber(c?.fuelGaugePercent),
    }));
  }

  // Normalize numeric top-level fields
  t.agreedCost = asOptionalNumber(t.agreedCost) ?? t.agreedCost;
  t.loadWeight = asOptionalNumber(t.loadWeight);
  t.plannedFuel = asOptionalNumber(t.plannedFuel);
  t.plannedDistanceKm = asOptionalNumber(t.plannedDistanceKm);
  t.plannedDurationHours = asOptionalNumber(t.plannedDurationHours);

  // Phase 4 summaries (if present)
  t.lastFuelGaugePercent = asOptionalNumber(t.lastFuelGaugePercent);

  // Support either naming (in case older docs exist)
  t.totalFuelUsed = asOptionalNumber(t.totalFuelUsed);
  t.totalExtraCost = asOptionalNumber(t.totalExtraCost);
  t.totalFuelUsedLiters = asOptionalNumber(t.totalFuelUsedLiters);

  return t;
}

/**
 * Prefer updatedAt, fallback to assignedAt, newest first.
 * ISO strings sort lexicographically.
 */
function sortTripsNewestFirst(arr: any[]) {
  return arr.sort((a, b) => {
    const aKey = String(a?.updatedAt ?? a?.assignedAt ?? "");
    const bKey = String(b?.updatedAt ?? b?.assignedAt ?? "");
    return bKey.localeCompare(aKey);
  });
}

/** =========================================================
 * GET /api/portal/[slug]/tracking/trips
 * ========================================================= */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const snap = await adminDb
      .collection("companies")
      .doc(slug)
      .collection("trips")
      .limit(200)
      .get();

    const trips = snap.docs.map((doc) => {
      const raw = doc.data() as any;
      return {
        id: doc.id,
        ...normalizeTripForUi(raw),
      };
    });

    sortTripsNewestFirst(trips);

    return NextResponse.json({ trips });
  } catch (err: any) {
    console.error("TRIPS GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load trips" },
      { status: 500 }
    );
  }
}

/** =========================================================
 * POST /api/portal/[slug]/tracking/trips
 * ========================================================= */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const body = (await req.json().catch(() => ({}))) as Partial<CreateTripBody>;

    // Required fields
    if (!body.truckId || !body.driverId) {
      return NextResponse.json(
        { error: "truckId and driverId are required" },
        { status: 400 }
      );
    }

    if (!body.startCity || !body.destinationCity) {
      return NextResponse.json(
        { error: "startCity and destinationCity are required" },
        { status: 400 }
      );
    }

    if (String(body.startCity).trim() === String(body.destinationCity).trim()) {
      return NextResponse.json(
        { error: "startCity and destinationCity must be different" },
        { status: 400 }
      );
    }

    if (!body.loadType || !String(body.loadType).trim()) {
      return NextResponse.json(
        { error: "loadType is required" },
        { status: 400 }
      );
    }

    const agreedCost = asOptionalNumber(body.agreedCost);
    if (agreedCost === undefined || agreedCost <= 0) {
      return NextResponse.json(
        { error: "agreedCost must be a number > 0" },
        { status: 400 }
      );
    }

    if (!isValidEtDay(body.etDay) || !isValidEtMonth(body.etMonth)) {
      return NextResponse.json(
        {
          error:
            "Invalid Ethiopian date. etDay must be 1..30 and etMonth must be 1..13.",
        },
        { status: 400 }
      );
    }

    const etDay = body.etDay as number;
    const etMonth = body.etMonth as number;

    // Code components
    const tripCodeDay = pad2(etDay);
    const tripCodeMonth = pad2(etMonth);

    // Load truck + driver
    const truckRef = adminDb
      .collection("companies")
      .doc(slug)
      .collection("trucks")
      .doc(body.truckId);

    const driverRef = adminDb
      .collection("companies")
      .doc(slug)
      .collection("drivers")
      .doc(body.driverId);

    const [truckSnap, driverSnap] = await Promise.all([
      truckRef.get(),
      driverRef.get(),
    ]);

    if (!truckSnap.exists)
      return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    if (!driverSnap.exists)
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });

    const truck = truckSnap.data() as any;
    const driver = driverSnap.data() as any;

    if (truck.status !== "ACTIVE") {
      return NextResponse.json({ error: "Truck is not ACTIVE" }, { status: 409 });
    }
    if (driver.status !== "ACTIVE") {
      return NextResponse.json({ error: "Driver is not ACTIVE" }, { status: 409 });
    }

    // Busy checks
    const activeStatuses = ["ASSIGNED", "STARTED", "IN_PROGRESS"];

    const [truckBusySnap, driverBusySnap] = await Promise.all([
      adminDb
        .collection("companies")
        .doc(slug)
        .collection("trips")
        .where("truckId", "==", body.truckId)
        .where("status", "in", activeStatuses)
        .limit(1)
        .get(),
      adminDb
        .collection("companies")
        .doc(slug)
        .collection("trips")
        .where("driverId", "==", body.driverId)
        .where("status", "in", activeStatuses)
        .limit(1)
        .get(),
    ]);

    if (!truckBusySnap.empty) {
      return NextResponse.json(
        { error: "This truck already has an active trip." },
        { status: 409 }
      );
    }
    if (!driverBusySnap.empty) {
      return NextResponse.json(
        { error: "This driver already has an active trip." },
        { status: 409 }
      );
    }

    // Trip Code sequence (1..9)
    const sameDaySnap = await adminDb
      .collection("companies")
      .doc(slug)
      .collection("trips")
      .where("tripCodeDay", "==", tripCodeDay)
      .where("tripCodeMonth", "==", tripCodeMonth)
      .get();

    const seq = sameDaySnap.size + 1;

    if (seq > 9) {
      return NextResponse.json(
        {
          error:
            "Daily trip sequence exceeded 9 for this Ethiopian date. Extend sequence to 2 digits if needed.",
        },
        { status: 409 }
      );
    }

    const letter = "A";
    const tripCodePlain = `${letter}${tripCodeDay}${tripCodeMonth}${seq}`;
    const tripCodeHash = sha256(tripCodePlain);

    const now = new Date().toISOString();

    const newTrip: Omit<Trip, "id"> = {
      // keep this field name for backward compatibility in your types/UI
      tenantSlug: slug,

      truckId: body.truckId,
      truckPlate: truck.plateNumber,
      truckOwner: truck.ownerName,

      driverId: body.driverId,
      driverName: driver.fullName,
      driverPhone: driver.phoneNumber,

      startCity: String(body.startCity).trim(),
      destinationCity: String(body.destinationCity).trim(),

      agreedCost,
      loadType: String(body.loadType).trim(),

      // IMPORTANT: do not write undefined
      loadWeight: asOptionalNumber(body.loadWeight),

      plannedFuel: asOptionalNumber(body.plannedFuel),
      plannedDistanceKm: asOptionalNumber(body.plannedDistanceKm),
      plannedDurationHours: asOptionalNumber(body.plannedDurationHours),

      status: "ASSIGNED",

      tripCodeHash,
      tripCodeDay,
      tripCodeMonth,
      tripDailySequence: seq,

      // Phase 3/4
      checkIns: [],
      lastCheckinCity: undefined,
      lastCheckinAt: undefined,

      // Phase 4 summaries (don’t pre-store undefined)
      lastFuelGaugePercent: undefined,

      // Prefer "undefined" over 0 so we don't store meaningless zeros
      totalFuelUsed: undefined,
      totalExtraCost: undefined,

      assignedAt: now,
      updatedAt: now,

      notes: body.notes ? String(body.notes).trim() : undefined,
    } as any;

    const ref = await adminDb
      .collection("companies")
      .doc(slug)
      .collection("trips")
      .add(stripUndefined(newTrip) as any);

    return NextResponse.json(
      { tripId: ref.id, tripCode: tripCodePlain, status: "ASSIGNED" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("TRIPS POST ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create trip" },
      { status: 500 }
    );
  }
}