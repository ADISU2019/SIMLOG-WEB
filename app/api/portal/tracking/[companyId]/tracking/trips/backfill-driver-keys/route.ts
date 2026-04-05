import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

function makeDriverLinkKey() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const adminDb = getAdminDb();

    const snap = await adminDb
      .collection("companies")
      .doc(companyId)
      .collection("trips")
      .where("status", "in", ["ASSIGNED", "STARTED", "IN_PROGRESS"])
      .limit(200)
      .get();

    let updated = 0;
    const batch = adminDb.batch();

    snap.docs.forEach((doc) => {
      const data = doc.data() as any;
      if (!data.driverLinkKey) {
        batch.update(doc.ref, { driverLinkKey: makeDriverLinkKey() });
        updated += 1;
      }
    });

    if (updated > 0) await batch.commit();

    return NextResponse.json({
      ok: true,
      checked: snap.size,
      updated,
      message:
        updated === 0
          ? "No trips needed backfill."
          : "Backfill completed.",
    });
  } catch (err: any) {
    console.error("BACKFILL DRIVER KEYS ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to backfill keys" },
      { status: 500 }
    );
  }
}