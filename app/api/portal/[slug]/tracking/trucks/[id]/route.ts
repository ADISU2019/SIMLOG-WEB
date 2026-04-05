import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * =========================================================
 * TRUCK UPDATE API (MVP)
 * =========================================================
 *
 * Route:
 *   PATCH /api/portal/[slug]/tracking/trucks/[id]
 *
 * Purpose:
 *   Update truck fields for a tenant (slug) and truck doc (id)
 *
 * Allowed fields:
 *   - ownerName: string
 *   - status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
 *   - plateNumber: string (stored uppercase; must be unique per tenant)
 *
 * Firestore path:
 *   tenants/{slug}/trucks/{id}
 * =========================================================
 */

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    /** 1) Unwrap route params (Next.js requirement) */
    const { slug, id } = await params;
    const adminDb = getAdminDb();

    /** 2) Read request body */
    const body = await req.json();

    /** 3) Build "update" object with only allowed fields */
    const update: Record<string, any> = {};

    // 3A) ownerName
    if (body.ownerName !== undefined) {
      update.ownerName = String(body.ownerName).trim();
    }

    // 3B) status
    if (body.status !== undefined) {
      update.status = body.status; // expected: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    }

    // 3C) plateNumber (uppercase)
    if (body.plateNumber !== undefined) {
      update.plateNumber = String(body.plateNumber).trim().toUpperCase();
    }

    /** 4) Reject empty updates (nothing to change) */
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update." },
        { status: 400 }
      );
    }

    /** 5) Uniqueness rule (only when plateNumber changes)
     *  plateNumber must be unique per tenant
     */
    if (update.plateNumber) {
      const existing = await adminDb
        .collection("tenants")
        .doc(slug)
        .collection("trucks")
        .where("plateNumber", "==", update.plateNumber)
        .limit(1)
        .get();

      if (!existing.empty) {
        const existingId = existing.docs[0].id;
        if (existingId !== id) {
          return NextResponse.json(
            { error: "Truck with this plateNumber already exists." },
            { status: 409 }
          );
        }
      }
    }

    /** 6) Always update updatedAt */
    update.updatedAt = new Date().toISOString();

    /** 7) Write update to Firestore */
    await adminDb
      .collection("tenants")
      .doc(slug)
      .collection("trucks")
      .doc(id)
      .update(update);

    /** 8) Return success */
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("TRUCK PATCH ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update truck" },
      { status: 500 }
    );
  }
}