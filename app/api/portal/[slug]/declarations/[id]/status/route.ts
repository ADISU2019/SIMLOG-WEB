import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["ASSESSED", "CANCELLED"],
  ASSESSED: ["SUBMITTED"],
  SUBMITTED: ["PAID", "CANCELLED"],
  PAID: ["RELEASED"],
  RELEASED: [],
  CANCELLED: [],
};

type RouteParams = Promise<{
  slug: string;
  id: string;
}>;

export async function POST(
  req: Request,
  { params }: { params: RouteParams }
) {
  try {
    const { slug, id } = await params;

    if (!slug || !id) {
      return NextResponse.json({ error: "Missing slug/id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const toStatus =
      typeof body?.toStatus === "string" ? body.toStatus.trim().toUpperCase() : "";

    if (!toStatus) {
      return NextResponse.json({ error: "Missing toStatus" }, { status: 400 });
    }

    const role =
      typeof body?.role === "string" && body.role.trim()
        ? body.role.trim()
        : "unknown";

    const actorUid =
      typeof body?.actorUid === "string" && body.actorUid.trim()
        ? body.actorUid.trim()
        : "unknown";

    const meta = body?.meta ?? {};

    const db = getAdminDb();
    const ref = db
      .collection("transiters")
      .doc(slug)
      .collection("declarations")
      .doc(id);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.data()?.status as string) || "DRAFT";

      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(toStatus)) {
        throw new Error(`Invalid transition: ${current} -> ${toStatus}`);
      }

      const now = new Date();

      const patch: Record<string, any> = {
        status: toStatus,
        updatedAt: now,
      };

      if (toStatus === "SUBMITTED") patch.submittedAt = now;
      if (toStatus === "PAID") patch.paidAt = now;
      if (toStatus === "RELEASED") patch.releasedAt = now;
      if (toStatus === "CANCELLED") patch.cancelledAt = now;

      tx.set(ref, patch, { merge: true });

      const auditRef = ref.collection("audit").doc();
      tx.set(auditRef, {
        action: "STATUS_CHANGE",
        fromStatus: current,
        toStatus,
        role,
        actorUid,
        meta,
        at: now,
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to change status" },
      { status: 500 }
    );
  }
}