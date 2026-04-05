// app/api/portal/tracking/[companyId]/tracking/trips/[id]/action/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Body = { action: "CANCEL" | "REOPEN" };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string; id: string }> }
) {
  try {
    const { companyId, id } = await params;
    const adminDb = getAdminDb();

    const body = (await req.json().catch(() => null)) as Body | null;
    const action = body?.action;

    if (action !== "CANCEL" && action !== "REOPEN") {
      return NextResponse.json({ error: "action must be CANCEL or REOPEN" }, { status: 400 });
    }

    const tripRef = adminDb.collection("companies").doc(companyId).collection("trips").doc(id);
    const snap = await tripRef.get();

    if (!snap.exists) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const trip = snap.data() as { status?: TripStatus };
    const status = trip.status ?? "ASSIGNED";

    const now = new Date().toISOString();

    if (action === "CANCEL") {
      // allow cancel from these
      const allowed: TripStatus[] = ["ASSIGNED", "STARTED", "IN_PROGRESS"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: `Cannot cancel from status ${status}` }, { status: 409 });
      }

      await tripRef.update({ status: "CANCELLED" as TripStatus, updatedAt: now });
      return NextResponse.json({ ok: true, status: "CANCELLED" });
    }

    if (action === "REOPEN") {
      // allow reopen only from cancelled
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: `Cannot reopen from status ${status}` }, { status: 409 });
      }

      // reopen goes back to ASSIGNED (clean + simple)
      await tripRef.update({ status: "ASSIGNED" as TripStatus, updatedAt: now });
      return NextResponse.json({ ok: true, status: "ASSIGNED" });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("TRIP ACTION ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}