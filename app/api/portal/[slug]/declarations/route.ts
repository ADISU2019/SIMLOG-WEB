import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await req.json().catch(() => ({}));

    const id: string | undefined = body?.id; // optional: force doc id = url id
    const createdBy: string | undefined = body?.createdBy;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const db = getAdminDb();
    const col = db.collection("transiters").doc(slug).collection("declarations");
    const ref = id ? col.doc(id) : col.doc();

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

    return NextResponse.json({ id: ref.id }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to create declaration" },
      { status: 500 }
    );
  }
}