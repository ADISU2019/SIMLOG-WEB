import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendTelegramMessage } from "@/lib/sendTelegramMessage";

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripType = "ONE_WAY" | "ROUND_TRIP";

type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN";

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
  tripType?: TripType;

  tripCode?: string | null;
  truckPlate?: string | null;
  driverName?: string | null;

  startCity?: string | null;
  destinationCity?: string | null;

  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerTelegramChatId?: string | null;

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

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function computeFuelFlags(checkIns: TripCheckIn[]): FuelFlag[] {
  const flags = new Set<FuelFlag>();
  if (!Array.isArray(checkIns) || checkIns.length === 0) return [];

  const latest = checkIns[0];
  const prev = checkIns[1];

  if (!isFiniteNumber(latest?.fuelGaugePercent)) {
    flags.add("MISSING_FUEL_GAUGE");
  }

  if (
    isFiniteNumber(latest?.fuelGaugePercent) &&
    isFiniteNumber(prev?.fuelGaugePercent) &&
    latest.fuelGaugePercent > prev.fuelGaugePercent
  ) {
    flags.add("FUEL_GAUGE_INCREASED");
  }

  if (isFiniteNumber(latest?.fuelUsed) && latest.fuelUsed >= 200) {
    flags.add("VERY_HIGH_FUEL_USED_SINGLE_CHECKIN");
  }

  return Array.from(flags);
}

function findNewestGauge(checkIns: TripCheckIn[]) {
  const entry = checkIns.find((c) => isFiniteNumber(c?.fuelGaugePercent));
  if (!entry) {
    return {
      lastFuelGaugePercent: undefined,
      lastFuelGaugeAt: undefined,
    };
  }

  return {
    lastFuelGaugePercent: entry.fuelGaugePercent,
    lastFuelGaugeAt: entry.at,
  };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ companyId: string; id: string }> }
) {
  try {
    const { companyId, id } = await params;

    const safeCompanyId = String(companyId ?? "").trim();
    const safeTripId = String(id ?? "").trim();

    if (!safeCompanyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    if (!safeTripId) {
      return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
    }

    const adminDb = getAdminDb();

    const tripRef = adminDb
      .collection("companies")
      .doc(safeCompanyId)
      .collection("trips")
      .doc(safeTripId);

    const snap = await tripRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = (snap.data() ?? {}) as TripDoc;
    const status = trip.status;

    // Idempotent
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

    const tripType: TripType =
      trip.tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";

    if (tripType === "ROUND_TRIP") {
      const startCity = String(trip.startCity ?? "").trim();
      const latestCity = String(checkIns[0]?.currentCity ?? "").trim();

      if (!startCity) {
        return NextResponse.json(
          { error: "Round-trip requires startCity to be set on the trip." },
          { status: 409 }
        );
      }

      if (latestCity.toLowerCase() !== startCity.toLowerCase()) {
        return NextResponse.json(
          {
            error: `Round-trip cannot be completed until truck returns to start station (${startCity}). Latest check-in: ${latestCity || "-"}`,
          },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();

    const totalFuelUsedLiters = sumFinite(checkIns.map((c) => c.fuelUsed));
    const totalExtraCost = sumFinite(checkIns.map((c) => c.extraCost));
    const { lastFuelGaugePercent, lastFuelGaugeAt } = findNewestGauge(checkIns);
    const fuelFlags = computeFuelFlags(checkIns);

    const report = stripUndefined({
      generatedAt: now,
      tripId: safeTripId,
      companyId: safeCompanyId,

      status: "COMPLETED" as TripStatus,
      tripType,

      tripCode: trip.tripCode,
      truckPlate: trip.truckPlate,
      driverName: trip.driverName,

      startCity: trip.startCity,
      destinationCity: trip.destinationCity,

      ownerName: trip.ownerName,
      ownerPhone: trip.ownerPhone,

      assignedAt: trip.assignedAt,
      startedAt: trip.startedAt,
      completedAt: now,

      checkInCount: checkIns.length,

      lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent)
        ? lastFuelGaugePercent
        : undefined,
      lastFuelGaugeAt:
        typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,

      totalFuelUsedLiters,
      totalExtraCost,

      fuelFlags,
    });

    await tripRef.update(
      stripUndefined({
        status: "COMPLETED" as TripStatus,
        completedAt: now,
        updatedAt: now,

        tripType,

        totalFuelUsedLiters,
        totalExtraCost,
        lastFuelGaugePercent: isFiniteNumber(lastFuelGaugePercent)
          ? lastFuelGaugePercent
          : undefined,
        lastFuelGaugeAt:
          typeof lastFuelGaugeAt === "string" ? lastFuelGaugeAt : undefined,

        fuelFlags,
        fuelFlagsUpdatedAt: now,

        report,
      })
    );

    let telegram = {
      ok: false,
      skipped: true,
      error: "Owner Telegram Chat ID missing",
    };

    const ownerChatId = String(trip.ownerTelegramChatId ?? "").trim();

    if (ownerChatId) {
      const message = `✅ <b>Trip Completed</b>

Owner: ${trip.ownerName || "-"}
Driver: ${trip.driverName || "-"}
Truck: ${trip.truckPlate || "-"}
Trip Code: ${trip.tripCode || "-"}

Route:
${trip.startCity || "-"} → ${trip.destinationCity || "-"}

Status: COMPLETED`;

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
      status: "COMPLETED",
      completedAt: now,
      tripType,
      fuelFlags,
      report,
      telegram,
    });
  } catch (err: unknown) {
    console.error("TRIP COMPLETE ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to complete trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}