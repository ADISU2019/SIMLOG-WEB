import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * =========================================================
 * TRIPS — LIST (for Dashboard + QR Dispatch Board)
 * =========================================================
 * Route:
 *   GET /api/portal/tracking/[companyId]/tracking/trips/list?limit=50
 *
 * Returns:
 *  - Trips sorted by updatedAt desc
 *  - Includes QR-required fields:
 *      ✅ tripCode
 *      ✅ driverLinkKey
 *      ✅ startCity / destinationCity (separate fields for UI)
 * =========================================================
 */

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripType = "ONE_WAY" | "ROUND_TRIP";

type TripDoc = {
  status?: TripStatus;

  truckPlate?: string;
  driverName?: string;

  startCity?: string;
  destinationCity?: string;

  loadType?: string;
  agreedCost?: number;

  tripType?: TripType;

  assignedAt?: string;
  updatedAt?: string;

  // ✅ QR additions (must exist in Firestore for QR board)
  tripCode?: string;
  tripCodeHash?: string; // not returned (security)
  driverLinkKey?: string;
  driverLinkKeyCreatedAt?: string;
};

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
function clampLimit(v: unknown, def = 50) {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : def;
  if (!Number.isFinite(n)) return def;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

function routeString(
  startCity?: string,
  destinationCity?: string,
  tripType?: TripType
) {
  const s = (startCity ?? "-").trim() || "-";
  const d = (destinationCity ?? "-").trim() || "-";
  const type: TripType = tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
  return type === "ROUND_TRIP" ? `${s} → ${d} → ${s}` : `${s} → ${d}`;
}

function cleanText(v: unknown, fallback = "-") {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  return s ? s : fallback;
}

/**
 * =========================================================
 * Handler
 * =========================================================
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: rawCompanyId } = await params;
    const companyId = String(rawCompanyId ?? "").trim();

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const adminDb = getAdminDb();

    const url = new URL(req.url);
    const limit = clampLimit(url.searchParams.get("limit") ?? undefined, 50);

    const snap = await adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    const trips = snap.docs.map((d) => {
      const t = d.data() as TripDoc;
      const tripType: TripType = (t.tripType ?? "ONE_WAY") as TripType;

      const startCity = cleanText(t.startCity, "-");
      const destinationCity = cleanText(t.destinationCity, "-");

      // ✅ These two make QR board work
      const tripCode = typeof t.tripCode === "string" ? t.tripCode.trim() : null;
      const driverLinkKey =
        typeof t.driverLinkKey === "string" ? t.driverLinkKey.trim() : null;

      return {
        id: d.id,
        status: (t.status ?? "ASSIGNED") as TripStatus,

        truckPlate: cleanText(t.truckPlate, "-"),
        driverName: cleanText(t.driverName, "-"),

        // ✅ Keep original "route" field
        route: routeString(startCity, destinationCity, tripType),

        // ✅ ADD: separate fields (your QR UI uses these)
        startCity,
        destinationCity,

        loadType: cleanText(t.loadType, "-"),
        agreedCost: typeof t.agreedCost === "number" ? t.agreedCost : null,

        tripType,

        assignedAt: t.assignedAt ?? null,
        updatedAt: t.updatedAt ?? null,

        // ✅ QR additions returned to client
        tripCode,
        driverLinkKey,

        // ✅ Optional convenience link for testing/debug (can remove later)
        driverUrl:
          tripCode || driverLinkKey
            ? `/portal/tracking/${companyId}/driver?${
                driverLinkKey
                  ? `k=${encodeURIComponent(driverLinkKey)}`
                  : `code=${encodeURIComponent(tripCode!)}`
              }`
            : null,
      };
    });

    return NextResponse.json({ ok: true, companyId, limit, trips });
  } catch (err: any) {
    console.error("TRIPS LIST ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load trips" },
      { status: 500 }
    );
  }
}