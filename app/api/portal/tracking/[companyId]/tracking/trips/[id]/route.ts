// app/api/portal/tracking/[companyId]/tracking/trips/[id]/start/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * =========================================================
 * PHASE 3 · STEP 3
 * START TRIP (Driver)
 * =========================================================
 *
 * POST /api/portal/tracking/[companyId]/tracking/trips/[id]/start
 *
 * Firestore path:
 *  companies/{companyId}/trips/{id}
 *
 * Rules:
 *  - Trip must exist
 *  - Allowed transitions:
 *      ASSIGNED -> STARTED
 *  - Idempotent:
 *      STARTED -> STARTED (returns ok)
 *  - Disallowed:
 *      IN_PROGRESS / COMPLETED / CANCELLED
 * =========================================================
 */

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export async function POST(
  _req: Request,
  { params }: { params: { companyId: string; id: string } }
) {
  try {
    const { companyId, id } = params;
    const adminDb = getAdminDb();

    const tripRef = adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .doc(id);

    const snap = await tripRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = snap.data() as {
      status?: TripStatus;
      startedAt?: string;
    };

    const status = trip?.status;

    // ✅ Idempotent: already started
    if (status === "STARTED") {
      return NextResponse.json({
        ok: true,
        status: "STARTED",
        startedAt: trip.startedAt ?? null,
        idempotent: true,
      });
    }

    // ✅ Only ASSIGNED can start
    if (status !== "ASSIGNED") {
      return NextResponse.json(
        { error: `Trip cannot be started from status: ${status ?? "UNKNOWN"}` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    await tripRef.update({
      status: "STARTED",
      startedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      status: "STARTED",
      startedAt: now,
    });
  } catch (err: unknown) {
    console.error("TRIP START ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to start trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}