import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { Truck } from "@/types/truck";

/**
 * =========================================================
 * TRUCKS API (MVP)
 * Firestore path:
 *  companies/{slug}/trucks
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
      .collection("trucks")
      .get();

    const trucks = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as any[];

    sortNewestFirstByIsoField(trucks, "createdAt");

    return NextResponse.json({ trucks });
  } catch (err: any) {
    console.error("TRUCKS GET ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load trucks" },
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

    if (!body?.plateNumber || !body?.ownerName) {
      return NextResponse.json(
        { error: "plateNumber and ownerName are required" },
        { status: 400 }
      );
    }

    const plateNumber = String(body.plateNumber).trim().toUpperCase();
    const ownerName = String(body.ownerName).trim();
    const status = String(body.status ?? "ACTIVE").trim().toUpperCase();
    const now = new Date().toISOString();

    const trucksCol = adminDb.collection("companies").doc(slug).collection("trucks");

    const existing = await trucksCol.where("plateNumber", "==", plateNumber).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: "Truck with this plateNumber already exists." },
        { status: 409 }
      );
    }

    const newTruck: Omit<Truck, "id"> = {
      tenantSlug: slug, // keep field name for now (no breaking change)
      plateNumber,
      ownerName,
      status: status as any,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await trucksCol.add(newTruck as any);

    return NextResponse.json({ id: ref.id, ...newTruck }, { status: 201 });
  } catch (err: any) {
    console.error("TRUCKS POST ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create truck" },
      { status: 500 }
    );
  }
}