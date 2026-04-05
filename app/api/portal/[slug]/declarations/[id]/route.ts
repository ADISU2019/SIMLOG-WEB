import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id } = params;

    if (!slug || !id) {
      return NextResponse.json({ error: "Missing slug/id" }, { status: 400 });
    }

    const body = await req.json();

    const db = getAdminDb();
    const ref = db
      .collection("transiters")
      .doc(slug)
      .collection("declarations")
      .doc(id);

    const now = new Date();

    // Only accept these fields from client (prevents random writes)
    const allowed = {
      header: body?.header ?? {},
      parties: body?.parties ?? {},
      transport: body?.transport ?? {},
      financial: body?.financial ?? {},
      items: body?.items ?? [],
      totals: body?.totals ?? {},
    };

    await ref.set(
      {
        ...allowed,
        id,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to save declaration" },
      { status: 500 }
    );
  }
}