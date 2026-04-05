import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

/**
 * =========================================================
 * TRIPS — CREATE
 * =========================================================
 * Route:
 *   POST /api/portal/tracking/[companyId]/tracking/trips/create
 *
 * What it does:
 *  - Validates required fields
 *  - Generates a driver Trip Code (returned to client)
 *  - Stores BOTH:
 *      ✅ tripCode
 *      ✅ tripCodeHash
 *  - ✅ Adds driverLinkKey
 *  - ✅ Stores truck owner connection fields for Telegram notification
 *  - ✅ Adds richer cashier payment block for payment workflow
 *  - Creates a trip doc under:
 *      companies/{companyId}/trips/{tripId}
 * =========================================================
 */

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripType = "ONE_WAY" | "ROUND_TRIP";

type PaymentMethod = "cash" | "bank" | "mobile" | "credit";
type PaymentStatus = "pending_cashier" | "paid" | "partial" | "rejected";

type CreateTripBody = {
  truckPlate: string;
  driverName: string;
  startCity: string;
  destinationCity: string;
  loadType?: string;
  agreedCost?: number;
  tripType?: TripType;

  ownerName?: string;
  ownerPhone?: string;
  ownerTelegramChatId?: string;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function makeTripCode() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const dd = String(Math.floor(Math.random() * 90) + 10);
  const mmm = String(Math.floor(Math.random() * 900) + 100);
  return `${letter}${dd}${mmm}`;
}

function makeDriverLinkKey() {
  return crypto.randomBytes(12).toString("base64url");
}

function cleanRequiredText(v: unknown, label: string) {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`${label} is required`);
  }
  return v.trim();
}

function cleanOptionalText(v: unknown) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function asOptionalNonNegativeNumber(v: unknown) {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  if (v < 0) return undefined;
  return v;
}

function asTripType(v: unknown): TripType {
  if (typeof v !== "string") return "ONE_WAY";
  const s = v.trim().toUpperCase();
  return s === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export async function POST(
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

    const body = (await req.json().catch(() => null)) as CreateTripBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const truckPlate = cleanRequiredText(body.truckPlate, "truckPlate");
    const driverName = cleanRequiredText(body.driverName, "driverName");
    const startCity = cleanRequiredText(body.startCity, "startCity");
    const destinationCity = cleanRequiredText(
      body.destinationCity,
      "destinationCity"
    );

    const loadType = cleanOptionalText(body.loadType);
    const agreedCost = asOptionalNonNegativeNumber(body.agreedCost);
    const tripType: TripType = asTripType(body.tripType);

    const ownerName = cleanOptionalText(body.ownerName);
    const ownerPhone = cleanOptionalText(body.ownerPhone);
    const ownerTelegramChatId = cleanOptionalText(body.ownerTelegramChatId);

    const tripCode = makeTripCode();
    const tripCodeHash = sha256(tripCode);
    const driverLinkKey = makeDriverLinkKey();

    const now = new Date().toISOString();
    const expectedAmount = agreedCost ?? 0;

    const tripDoc = stripUndefined({
      status: "ASSIGNED" as TripStatus,

      truckPlate,
      driverName,
      startCity,
      destinationCity,

      loadType,
      agreedCost,
      tripType,

      assignedAt: now,
      updatedAt: now,

      tripCode,
      tripCodeHash,

      driverLinkKey,
      driverLinkKeyCreatedAt: now,

      ownerName,
      ownerPhone,
      ownerTelegramChatId,

      payment: {
        method: "cash" as PaymentMethod,
        status: "pending_cashier" as PaymentStatus,
        expectedAmount,
        paidAmount: 0,
        balance: expectedAmount,
        currency: "ETB",
        receiptNumber: "",
        receiptUrl: "",
        receiptPath: "",
        referenceNumber: "",
        acceptedBy: "",
        acceptedAt: null,
        note: "",
      },
    });

    const ref = await adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .add(tripDoc);

    return NextResponse.json({
      ok: true,
      tripId: ref.id,
      tripCode,
      driverLinkKey,
      tripType,
      status: "ASSIGNED",
      assignedAt: now,
      truckPlate,
      driverName,
      startCity,
      destinationCity,
      loadType: loadType ?? null,
      agreedCost: agreedCost ?? 0,
      ownerName: ownerName ?? null,
      ownerPhone: ownerPhone ?? null,
      ownerTelegramChatId: ownerTelegramChatId ?? null,
      payment: {
        method: "cash",
        status: "pending_cashier",
        expectedAmount,
        paidAmount: 0,
        balance: expectedAmount,
        currency: "ETB",
        receiptNumber: "",
        receiptUrl: "",
        receiptPath: "",
        referenceNumber: "",
        acceptedBy: "",
        acceptedAt: null,
        note: "",
      },
    });
  } catch (err: any) {
    console.error("TRIP CREATE ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create trip" },
      { status: 500 }
    );
  }
}