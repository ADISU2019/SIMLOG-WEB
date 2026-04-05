// app/api/portal/[slug]/tracking/trips/by-code/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

/**
 * =========================================================
 * TRIP LOOKUP BY CODE (PHASE 3 · STEP 1)
 * =========================================================
 *
 * POST /api/portal/[slug]/tracking/trips/by-code
 *
 * Firestore path (platform structure):
 *  companies/{slug}/trips
 *
 * Security:
 *  - Plain code is NEVER stored
 *  - Only SHA-256 hash is matched
 * =========================================================
 */

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  if (!code) return null;
  // Basic sanity check for MVP pattern: L + digits (you can tighten later)
  if (code.length < 5 || code.length > 10) return null;
  return code;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const body = await req.json().catch(() => null);
    const code = normalizeCode(body?.code);

    if (!code) {
      return NextResponse.json({ error: "Trip code is required" }, { status: 400 });
    }

    const codeHash = sha256(code);

    const snap = await adminDb
      .collection("companies") // ✅ platform structure
      .doc(slug)
      .collection("trips")
      .where("tripCodeHash", "==", codeHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid or expired trip code" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const trip = doc.data() as any;

    // Return a SAFE driver-facing payload
    return NextResponse.json({
      tripId: doc.id,

      status: trip.status,

      truckPlate: trip.truckPlate,
      driverName: trip.driverName,

      startCity: trip.startCity,
      destinationCity: trip.destinationCity,

      loadType: trip.loadType,
      agreedCost: trip.agreedCost,

      assignedAt: trip.assignedAt,

      // Helpful for driver UI (optional fields if you want)
      startedAt: trip.startedAt ?? null,
      completedAt: trip.completedAt ?? null,
    });
  } catch (err: unknown) {
    console.error("TRIP BY CODE ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to lookup trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}