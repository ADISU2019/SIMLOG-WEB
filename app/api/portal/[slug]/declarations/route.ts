// app/api/portal/[slug]/declarations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type RouteParams = Promise<{
  slug: string;
}>;

export async function POST(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));

    const createdBy =
      typeof body?.createdBy === "string" ? body.createdBy.trim() : undefined;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const db = getAdminDb();

    const col = db
      .collection("transiters")
      .doc(slug)
      .collection("declarations");

    const ref = col.doc();
    const now = new Date();

    await ref.set(
      {
        id: ref.id,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || "unknown",
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, id: ref.id }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to create declaration" },
      { status: 500 }
    );
  }
}