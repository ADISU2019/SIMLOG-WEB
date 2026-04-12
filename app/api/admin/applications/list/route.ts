import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();

    const snap = await db
      .collection("transiters")
      .where("approvalStatus", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const applications = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;

      return {
        id: doc.id,
        name: data?.name ?? "",
        slug: data?.slug ?? doc.id,
        email: data?.email ?? "",
        phone: data?.phone ?? "",
        ownerUid: data?.ownerUid ?? "",
        approvalStatus: data?.approvalStatus ?? "pending",
        isActive: data?.isActive ?? false,
        createdAt: data?.createdAt ?? null,
        updatedAt: data?.updatedAt ?? null,
      };
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load pending applications." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.id ?? "").trim();
    const action = String(body?.action ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Missing application id." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ref = db.collection("transiters").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    await ref.update({
      approvalStatus: action === "approve" ? "approved" : "rejected",
      isActive: action === "approve",
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: "dev-admin-bypass",
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update application." },
      { status: 500 }
    );
  }
}