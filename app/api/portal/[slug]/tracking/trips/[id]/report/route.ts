// app/api/portal/[slug]/tracking/trips/[id]/report/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/portal/[slug]/tracking/trips/[id]/report
 * - Returns trip.report if present
 * - Otherwise returns a computed preview (so you can verify anytime)
 */

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const adminDb = getAdminDb();

    const ref = adminDb.collection("companies").doc(slug).collection("trips").doc(id);
    const snap = await ref.get();

    if (!snap.exists) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const trip = snap.data() as any;

    // If snapshot exists, return it (canonical Phase 4 output)
    if (trip.report) {
      return NextResponse.json({ ok: true, report: trip.report, source: "snapshot" });
    }

    // Otherwise compute a preview (useful before completion)
    const checkIns = Array.isArray(trip.checkIns) ? trip.checkIns : [];
    const totalFuelUsedLiters = sumFinite(checkIns.map((c: any) => c?.fuelUsed));
    const totalExtraCost = sumFinite(checkIns.map((c: any) => c?.extraCost));
    const newestGauge = checkIns.find((c: any) => isFiniteNumber(c?.fuelGaugePercent));

    const preview = {
      generatedAt: new Date().toISOString(),
      tripId: id,
      tenantSlug: slug,
      status: trip.status,

      truckPlate: trip.truckPlate,
      driverName: trip.driverName,

      startCity: trip.startCity,
      destinationCity: trip.destinationCity,

      assignedAt: trip.assignedAt,
      startedAt: trip.startedAt,
      completedAt: trip.completedAt,

      checkInCount: checkIns.length,

      lastFuelGaugePercent: newestGauge?.fuelGaugePercent,
      lastFuelGaugeAt: newestGauge?.at,

      totalFuelUsedLiters,
      totalExtraCost,

      fuelFlags: Array.isArray(trip.fuelFlags) ? trip.fuelFlags : [],
    };

    return NextResponse.json({ ok: true, report: preview, source: "preview" });
  } catch (err: any) {
    console.error("REPORT GET ERROR:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load report" }, { status: 500 });
  }
}