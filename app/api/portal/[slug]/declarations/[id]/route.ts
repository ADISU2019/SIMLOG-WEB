// app/api/portal/[slug]/declarations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/portal/[slug]/declarations/[id]">
) {
  try {
    const { slug, id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const createdBy =
      typeof body?.createdBy === "string" ? body.createdBy.trim() : undefined;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db
      .collection("transiters")
      .doc(slug)
      .collection("declarations")
      .doc(id);

    const now = new Date();

    await ref.set(
      {
        id,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || "unknown",
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to create declaration" },
      { status: 500 }
    );
  }
}