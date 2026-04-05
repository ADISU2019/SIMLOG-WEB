import { db, auth } from "@/lib/firebase";
import { DeclarationStatus } from "@/types/declarationStatus";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type StatusChangePayload = {
  slug: string;
  declarationId: string;
  fromStatus: DeclarationStatus;
  toStatus: DeclarationStatus;
  role?: string;
  note?: string;
  meta?: Record<string, any>;
};

export async function logDeclarationStatusChange({
  slug,
  declarationId,
  fromStatus,
  toStatus,
  role,
  note,
  meta,
}: StatusChangePayload) {
  const auditRef = collection(
    db,
    "transiters",
    slug,
    "declarations",
    declarationId,
    "audit"
  );

  const actorUid = auth.currentUser?.uid || "unknown";

  await addDoc(auditRef, {
    action: "STATUS_CHANGE",
    fromStatus,
    toStatus,
    role: role || "unknown",
    actorUid,
    note: note || "",
    meta: meta || {},
    at: serverTimestamp(),
  });
}