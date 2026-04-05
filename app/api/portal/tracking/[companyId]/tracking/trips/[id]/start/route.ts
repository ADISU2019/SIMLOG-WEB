import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sendTelegramMessage } from "@/lib/sendTelegramMessage";

/**
 * POST /api/portal/tracking/[companyId]/tracking/trips/[id]/start
 * Firestore: companies/{companyId}/trips/{id}
 */

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripDoc = {
  status?: TripStatus;
  startedAt?: string;
  updatedAt?: string;

  tripCode?: string | null;
  truckPlate?: string | null;
  driverName?: string | null;
  startCity?: string | null;
  destinationCity?: string | null;

  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerTelegramChatId?: string | null;
};

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
    const status = trip.status ?? "ASSIGNED";

    // Idempotent response
    if (status === "STARTED") {
      return NextResponse.json({
        ok: true,
        status: "STARTED",
        startedAt: trip.startedAt ?? null,
        idempotent: true,
      });
    }

    // Only ASSIGNED can move to STARTED
    if (status !== "ASSIGNED") {
      return NextResponse.json(
        { error: `Trip cannot be started from status: ${status}` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    await tripRef.update({
      status: "STARTED",
      startedAt: now,
      updatedAt: now,
    });

    let telegram = {
      ok: false,
      skipped: true,
      error: "Owner Telegram Chat ID missing",
    };

    const ownerChatId = String(trip.ownerTelegramChatId ?? "").trim();

    if (ownerChatId) {
      const message = `🚛 <b>Trip Started</b>

Owner: ${trip.ownerName || "-"}
Driver: ${trip.driverName || "-"}
Truck: ${trip.truckPlate || "-"}
Trip Code: ${trip.tripCode || "-"}

Route:
${trip.startCity || "-"} → ${trip.destinationCity || "-"}

Status: STARTED`;

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
      status: "STARTED",
      startedAt: now,
      telegram,
    });
  } catch (err: unknown) {
    console.error("TRIP START ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to start trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}