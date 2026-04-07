// app/api/portal/[slug]/tracking/drivers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type RouteParams = Promise<{
  slug: string;
  id: string;
}>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { slug, id } = await params;
    const adminDb = getAdminDb();

    if (!slug || !id) {
      return NextResponse.json(
        { error: "Missing slug or id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const update: Record<string, any> = {};

    if (body.fullName !== undefined) {
      update.fullName = String(body.fullName).trim();
    }

    if (body.phoneNumber !== undefined) {
      const raw = String(body.phoneNumber).trim();
      update.phoneNumber = raw.length ? raw : null;
    }

    if (body.status !== undefined) {
      update.status = body.status; // "ACTIVE" | "INACTIVE"
    }

    // Reject empty updates
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update." },
        { status: 400 }
      );
    }

    update.updatedAt = new Date().toISOString();

    await adminDb
      .collection("tenants")
      .doc(slug)
      .collection("drivers")
      .doc(id)
      .set(update, { merge: true });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Failed to update driver" },
      { status: 500 }
    );
  }
}