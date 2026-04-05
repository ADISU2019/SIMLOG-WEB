// app/api/portal/tracking/[companyId]/driver/checkin/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

/**
 * =========================================================
 * DRIVER CHECK-IN (Manual, GPS optional later)
 * =========================================================
 * POST /api/portal/tracking/[companyId]/driver/checkin
 *
 * Body (recommended):
 *  {
 *    "tripId": "abc123",
 *    "currentCity": "Bishoftu",
 *    "note": "optional",
 *    "fuelUsed": 20,
 *    "extraCost": 0,
 *    "fuelGaugePercent": 65,
 *    "locationText": "Bishoftu - around bus station",      // optional
 *    "locationSource": "MANUAL"                            // optional (default MANUAL)
 *  }
 *
 * Alternative (fallback):
 *  { "code": "A05012", ...same fields... }
 *
 * Writes:
 *  - companies/{companyId}/trips/{tripId}/checkins/{checkinId}
 * Updates:
 *  - companies/{companyId}/trips/{tripId}
 * =========================================================
 */

type LocationSource = "MANUAL" | "GPS";

type CheckinBody = {
  tripId?: string;
  code?: string;

  currentCity: string;
  note?: string;

  fuelUsed?: number;
  extraCost?: number;
  fuelGaugePercent?: number;

  // optional future-proof fields
  locationText?: string;
  locationSource?: LocationSource;
};

type TripStatus = "ASSIGNED" | "STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

/** ----------------------------
 * Helpers
 * ---------------------------- */
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = String(input).trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return null;
  if (code.length < 5 || code.length > 12) return null;
  return code;
}

function cleanRequiredText(v: unknown, label: string) {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${label} is required`);
  return v.trim();
}

function cleanOptionalText(v: unknown) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function asOptionalNonNegativeNumber(v: unknown) {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0) return undefined;
  return n;
}

function asOptionalPercent0to100(v: unknown) {
  const n = asOptionalNonNegativeNumber(v);
  if (n === undefined) return undefined;
  if (n > 100) return undefined;
  return n;
}

function asLocationSource(v: unknown): LocationSource {
  if (typeof v !== "string") return "MANUAL";
  const s = v.trim().toUpperCase();
  return s === "GPS" ? "GPS" : "MANUAL";
}

/** Remove undefined keys so Firestore doesn't receive undefined */
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

async function resolveTripIdByCode(adminDb: FirebaseFirestore.Firestore, companyId: string, code: string) {
  const codeHash = sha256(code);

  const snap = await adminDb
    .collection("companies")
    .doc(companyId)
    .collection("trips")
    .where("tripCodeHash", "==", codeHash)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].id;
}

/** ----------------------------
 * Route
 * ---------------------------- */
export async function POST(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId: rawCompanyId } = await params;
    const companyId = String(rawCompanyId ?? "").trim();
    if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

    const adminDb = getAdminDb();

    const body = (await req.json().catch(() => null)) as CheckinBody | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    // Required
    const currentCity = cleanRequiredText(body.currentCity, "currentCity");

    // Optional text
    const note = cleanOptionalText(body.note);
    const locationText = cleanOptionalText(body.locationText);
    const locationSource = asLocationSource(body.locationSource);

    // Optional numbers
    const fuelUsed = asOptionalNonNegativeNumber(body.fuelUsed);
    const extraCost = asOptionalNonNegativeNumber(body.extraCost);
    const fuelGaugePercent = asOptionalPercent0to100(body.fuelGaugePercent);

    // Resolve tripId
    let tripId = String(body.tripId ?? "").trim();
    if (!tripId) {
      const code = normalizeCode(body.code);
      if (!code) {
        return NextResponse.json(
          { error: "tripId is required (or provide a valid code)" },
          { status: 400 }
        );
      }
      const resolved = await resolveTripIdByCode(adminDb, companyId, code);
      if (!resolved) return NextResponse.json({ error: "Trip not found (404)" }, { status: 404 });
      tripId = resolved;
    }

    const tripRef = adminDb.collection("companies").doc(companyId).collection("trips").doc(tripId);
    const checkinsRef = tripRef.collection("checkins").doc();

    const now = new Date().toISOString();

    // Transaction keeps trip + checkin consistent
    await adminDb.runTransaction(async (tx) => {
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) throw new Error("Trip not found (404)");

      const trip = tripSnap.data() as any;

      const prevStatus = String(trip?.status ?? "ASSIGNED").toUpperCase() as TripStatus;
      const nextStatus: TripStatus =
        prevStatus === "STARTED" || prevStatus === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : prevStatus === "ASSIGNED"
          ? "ASSIGNED"
          : prevStatus;

      const checkinDoc = stripUndefined({
        createdAt: now,
        updatedAt: now,

        currentCity,
        note,

        fuelUsed,
        extraCost,
        fuelGaugePercent,

        // future-proofing (manual now)
        locationText,
        locationSource,

        // helpful for reporting
        tripStatusAtCheckin: prevStatus,
      });

      tx.set(checkinsRef, checkinDoc);

      const tripUpdate = stripUndefined({
        updatedAt: now,
        status: nextStatus,

        // Last check-in fields (simple + useful)
        lastCheckinAt: now,
        lastKnownCity: currentCity,

        ...(fuelGaugePercent !== undefined
          ? { lastFuelGaugePercent: fuelGaugePercent, lastFuelGaugeDate: now }
          : {}),

        // Optional totals (safe increments)
        ...(fuelUsed !== undefined ? { totalFuelUsedLiters: FieldValue.increment(fuelUsed) } : {}),
        ...(extraCost !== undefined ? { totalExtraCost: FieldValue.increment(extraCost) } : {}),
      });

      tx.set(tripRef, tripUpdate, { merge: true });
    });

    return NextResponse.json({
      ok: true,
      companyId,
      tripId,
      checkinId: checkinsRef.id,
      savedAt: now,
    });
  } catch (err: unknown) {
    console.error("DRIVER CHECKIN ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to save check-in";
    const status = message.includes("(404)") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}