// app/api/portal/tracking/[companyId]/tracking/trips/[id]/regenerate-code/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeTripCode() {
  const n = crypto.randomInt(10000, 99999);
  return `A${n}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ companyId: string; id: string }> }
) {
  try {
    const { companyId, id } = await params;
    const adminDb = getAdminDb();

    const tripRef = adminDb.collection("companies").doc(companyId).collection("trips").doc(id);
    const snap = await tripRef.get();

    if (!snap.exists) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const trip = snap.data() as { status?: TripStatus };
    const status = trip.status ?? "ASSIGNED";

    // Usually you don't regenerate once completed (keeps audit simple)
    if (status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot regenerate code for a completed trip." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const tripCode = makeTripCode();
    const tripCodeHash = sha256(tripCode);

    await tripRef.update({
      tripCodeHash,
      tripCodeIssuedAt: now,
      updatedAt: now,
    });

    // return plain code ONCE
    return NextResponse.json({ ok: true, tripId: id, tripCode });
  } catch (err: unknown) {
    console.error("REGENERATE CODE ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to regenerate code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}