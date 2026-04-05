import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const adminDb = getAdminDb();
  const { slug, id } = params;

  const body = await req.json();

  const update: Record<string, any> = {};

  if (body.fullName !== undefined) {
    update.fullName = String(body.fullName).trim();
  }

  if (body.phoneNumber !== undefined) {
    const raw = String(body.phoneNumber).trim();
    update.phoneNumber = raw.length ? raw : undefined;
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
    .update(update);

  return NextResponse.json({ ok: true });
}