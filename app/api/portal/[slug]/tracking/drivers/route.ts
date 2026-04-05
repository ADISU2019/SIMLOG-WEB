// app/api/portal/[slug]/tracking/drivers/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { Driver } from "@/types/driver";

/**
 * =========================================================
 * DRIVERS API (MVP)
 * Firestore path:
 *  companies/{slug}/drivers
 *
 * - GET: list drivers
 * - POST: create driver
 * =========================================================
 */

function sortNewestFirstByIsoField<T extends Record<string, any>>(arr: T[], field: string) {
  return arr.sort((a, b) => String(b?.[field] ?? "").localeCompare(String(a?.[field] ?? "")));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const snap = await adminDb
      .collection("companies")
      .doc(slug)
      .collection("drivers")
      .get();

    const drivers = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as any[];

    sortNewestFirstByIsoField(drivers, "createdAt");

    return NextResponse.json({ drivers });
  } catch (err: any) {
    console.error("DRIVERS GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load drivers" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const adminDb = getAdminDb();

    const body = await req.json().catch(() => ({}));

    if (!body?.fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const fullName = String(body.fullName).trim();
    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const phoneNumber =
      body.phoneNumber !== undefined && body.phoneNumber !== null && String(body.phoneNumber).trim()
        ? String(body.phoneNumber).trim()
        : undefined;

    const status = String(body.status ?? "ACTIVE").trim().toUpperCase();
    const now = new Date().toISOString();

    const driversCol = adminDb.collection("companies").doc(slug).collection("drivers");

    const docData: Omit<Driver, "id"> = {
      tenantSlug: slug, // keep field name for now (no breaking change)
      fullName,
      phoneNumber,
      status: status as any,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await driversCol.add(docData as any);

    return NextResponse.json({ id: ref.id, ...docData }, { status: 201 });
  } catch (err: any) {
    console.error("DRIVERS POST ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create driver" },
      { status: 500 }
    );
  }
}