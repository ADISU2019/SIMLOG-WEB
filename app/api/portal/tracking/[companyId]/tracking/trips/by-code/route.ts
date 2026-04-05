import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

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

function cleanCompanyId(input: unknown): string | null {
  const s = String(input ?? "").trim();
  return s ? s : null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: rawCompanyId } = await params;
    const companyId = cleanCompanyId(rawCompanyId);

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const code = normalizeCode(body?.code);

    if (!code) {
      return NextResponse.json(
        { error: "Trip code is required (example: A05012)" },
        { status: 400 }
      );
    }

    const codeHash = sha256(code);
    const adminDb = getAdminDb();

    const snap = await adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .where("tripCodeHash", "==", codeHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Trip not found (404)" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const trip = doc.data() as any;

    return NextResponse.json({
      ok: true,

      tripId: doc.id,

      status: trip.status ?? "ASSIGNED",
      tripType: trip.tripType ?? "ONE_WAY",

      truckPlate: trip.truckPlate ?? "-",
      driverName: trip.driverName ?? "-",

      startCity: trip.startCity ?? "-",
      destinationCity: trip.destinationCity ?? "-",

      loadType: trip.loadType ?? null,
      agreedCost: trip.agreedCost ?? null,

      ownerName: trip.ownerName ?? null,
      ownerPhone: trip.ownerPhone ?? null,
      ownerTelegramChatId:
        trip.ownerTelegramChatId ??
        trip.truckOwnerTelegramChatId ??
        trip.ownerChatId ??
        null,

      assignedAt: trip.assignedAt ?? null,
      updatedAt: trip.updatedAt ?? null,
      startedAt: trip.startedAt ?? null,
      completedAt: trip.completedAt ?? null,
    });
  } catch (err: unknown) {
    console.error("TRIP BY CODE ERROR:", err);
    const message = err instanceof Error ? err.message : "Failed to lookup trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}