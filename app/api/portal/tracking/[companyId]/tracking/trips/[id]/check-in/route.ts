import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendTelegramMessage } from "@/lib/sendTelegramMessage";
import crypto from "crypto";

/**
 * =========================================================
 * TRIP CHECK-IN (Driver / Dispatcher)
 * =========================================================
 * POST /api/portal/tracking/:companyId/tracking/trips/:id/check-in
 *
 * Purpose:
 *  - Add a check-in record (city, optional fuel + cost + gauge + note)
 *  - Auto-advance status STARTED -> IN_PROGRESS on first check-in
 *  - Maintain rollups (last check-in city/time, fuel totals, flags)
 *  - Auto-send Telegram notification to owner after successful check-in
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

type CheckInBody = {
  currentCity: string;
  note?: string;
  fuelUsed?: number;
  extraCost?: number;
  fuelGaugePercent?: number;
};

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

  tripCode?: string | null;
  truckPlate?: string | null;
  driverName?: string | null;
  startCity?: string | null;
  destinationCity?: string | null;

  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerTelegramChatId?: string | null;

  lastCheckinCity?: string;
  lastCheckinAt?: string;

  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;

  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

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

function deepStripUndefined<T>(val: T): T {
  if (Array.isArray(val)) return val.map((x) => deepStripUndefined(x)) as any;

  if (val && typeof val === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(val as any)) {
      if (v === undefined) continue;
      out[k] = deepStripUndefined(v);
    }
    return out;
  }

  return val;
}

const VERY_HIGH_FUEL_USED_LITERS = 200;

function computeFuelFlags(checkInsNewestFirst: TripCheckIn[]): FuelFlag[] {
  const flags = new Set<FuelFlag>();

  if (checkInsNewestFirst.some((c) => c.fuelGaugePercent === undefined)) {
    flags.add("MISSING_FUEL_GAUGE");
  }

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

  if (
    checkInsNewestFirst.some(
      (c) => isFiniteNumber(c.fuelUsed) && c.fuelUsed >= VERY_HIGH_FUEL_USED_LITERS
    )
  ) {
    flags.add("VERY_HIGH_FUEL_USED_SINGLE_CHECKIN");
  }

  return Array.from(flags);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string; id: string }> }
) {
  try {
    const { companyId: rawCompanyId, id: rawTripId } = await params;

    const companyId = String(rawCompanyId ?? "").trim();
    const tripId = String(rawTripId ?? "").trim();

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId in URL" }, { status: 400 });
    }
    if (!tripId) {
      return NextResponse.json({ error: "Missing trip id in URL" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as CheckInBody | null;

    if (!body || typeof body.currentCity !== "string" || !body.currentCity.trim()) {
      return NextResponse.json({ error: "currentCity is required" }, { status: 400 });
    }

    const currentCity = body.currentCity.trim();
    const fuelUsed = asOptionalNonNegativeNumber(body.fuelUsed);
    const extraCost = asOptionalNonNegativeNumber(body.extraCost);
    const fuelGaugePercent = asOptionalPercent(body.fuelGaugePercent);
    const note = cleanOptionalText(body.note);

    const adminDb = getAdminDb();

    const tripRef = adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .doc(tripId);

    const now = new Date().toISOString();

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(tripRef);
      if (!snap.exists) {
        return { ok: false as const, status: 404 as const, error: "Trip not found" };
      }

      const trip = (snap.data() ?? {}) as TripDoc;

      const status = trip.status;
      const allowed: TripStatus[] = ["STARTED", "IN_PROGRESS"];

      if (!status || !allowed.includes(status)) {
        return {
          ok: false as const,
          status: 409 as const,
          error: `Cannot check-in when status is ${status ?? "UNKNOWN"}`,
        };
      }

      const checkIn: TripCheckIn = deepStripUndefined({
        id: makeId(),
        at: now,
        currentCity,
        note,
        fuelUsed,
        extraCost,
        fuelGaugePercent,
      });

      const prevCheckIns = Array.isArray(trip.checkIns) ? trip.checkIns : [];
      const nextCheckIns: TripCheckIn[] = [checkIn, ...prevCheckIns];

      const nextStatus: TripStatus = status === "STARTED" ? "IN_PROGRESS" : status;

      const totalFuelUsedLiters = sumFinite(nextCheckIns.map((c) => c.fuelUsed));
      const totalExtraCost = sumFinite(nextCheckIns.map((c) => c.extraCost));

      const newestGaugeEntry = nextCheckIns.find((c) => isFiniteNumber(c.fuelGaugePercent));
      const lastFuelGaugePercent = newestGaugeEntry?.fuelGaugePercent;
      const lastFuelGaugeAt = newestGaugeEntry?.at;

      const fuelFlags = computeFuelFlags(nextCheckIns);

      const update: Partial<TripDoc> = deepStripUndefined({
        checkIns: nextCheckIns,
        lastCheckinCity: currentCity,
        lastCheckinAt: now,
        status: nextStatus,
        updatedAt: now,
        lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent)
          ? lastFuelGaugePercent
          : undefined,
        lastFuelGaugeAt:
          typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,
        totalFuelUsedLiters,
        totalExtraCost,
        fuelFlags,
        fuelFlagsUpdatedAt: now,
      });

      tx.update(tripRef, update);

      return {
        ok: true as const,
        trip,
        nextStatus,
        checkIn,
        summary: {
          lastFuelGaugePercent: (update.lastFuelGaugePercent ?? null) as number | null,
          lastFuelGaugeAt: (update.lastFuelGaugeAt ?? null) as string | null,
          totalFuelUsedLiters,
          totalExtraCost,
          fuelFlags,
        },
      };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    let telegram = {
      ok: false,
      skipped: true,
      error: "Owner Telegram Chat ID missing",
    };

    const ownerChatId = String(result.trip.ownerTelegramChatId ?? "").trim();

    if (ownerChatId) {
      const message = `📍 <b>Trip Check-in Update</b>

Owner: ${result.trip.ownerName || "-"}
Driver: ${result.trip.driverName || "-"}
Truck: ${result.trip.truckPlate || "-"}
Trip Code: ${result.trip.tripCode || "-"}

Current City: ${currentCity}
Fuel Used: ${fuelUsed ?? "-"} L
Extra Cost: ${extraCost ?? "-"}
Fuel Gauge: ${fuelGaugePercent ?? "-"}%

Route:
${result.trip.startCity || "-"} → ${result.trip.destinationCity || "-"}

Status: ${result.nextStatus}`;

      const sent = await sendTelegramMessage({
        chatId: ownerChatId,
        message,
      });

      if (sent.ok) {
        telegram = {
          ok: true,
          skipped: false,
          error: "",
        };
      } else {
        telegram = {
          ok: false,
          skipped: false,
          error: sent.error || "Telegram send failed",
        };
      }
    }

    return NextResponse.json({
      ok: true,
      status: result.nextStatus,
      checkIn: result.checkIn,
      summary: result.summary,
      telegram,
    });
  } catch (err: unknown) {
    console.error("CHECK-IN ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to submit check-in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}