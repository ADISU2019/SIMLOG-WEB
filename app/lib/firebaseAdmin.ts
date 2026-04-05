/**
 * =========================================================
 * Firebase Admin Initialization (Server-only)
 * =========================================================
 *
 * Purpose:
 *  - Initialize Firebase Admin SDK exactly once
 *  - Provide Firestore (admin) instance for API routes
 *
 * Why this file matters:
 *  - All /api/portal/* routes depend on this
 *  - Incorrect private key parsing causes crypto errors
 *
 * Supported env formats:
 *  1) FIREBASE_PRIVATE_KEY_BASE64  ✅ (recommended)
 *  2) FIREBASE_PRIVATE_KEY         (fallback, uses \\n replacement)
 * =========================================================
 */

import admin from "firebase-admin";

/**
 * ---------------------------------------------------------
 * Resolve Firebase private key safely
 * ---------------------------------------------------------
 *
 * Priority:
 *  1) Base64-encoded private key (most reliable)
 *  2) Raw private key with escaped newlines
 */
function getPrivateKey(): string | undefined {
  // ✅ Option 1: Base64 (preferred)
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch (err) {
      console.error("Failed to decode FIREBASE_PRIVATE_KEY_BASE64");
      throw err;
    }
  }

  // ⚠️ Option 2: Raw key with \n escapes
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;

  return raw.replace(/\\n/g, "\n");
}

/**
 * ---------------------------------------------------------
 * Initialize (or reuse) Firebase Admin App
 * ---------------------------------------------------------
 */
export function getAdminApp() {
  // Reuse app if already initialized (important for Next.js)
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  // Hard fail early with clear message
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars. Required:\n" +
        "- FIREBASE_PROJECT_ID\n" +
        "- FIREBASE_CLIENT_EMAIL\n" +
        "- FIREBASE_PRIVATE_KEY_BASE64 (recommended) OR FIREBASE_PRIVATE_KEY"
    );
  }

  // Optional debug (safe: prints only booleans)
  /*
  console.log("Firebase Admin ENV check:", {
    projectId: !!projectId,
    clientEmail: !!clientEmail,
    privateKey: !!privateKey,
  });
  */

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin.app();
}

/**
 * ---------------------------------------------------------
 * Get Firestore Admin DB
 * ---------------------------------------------------------
 */
export function getAdminDb() {
  getAdminApp();
  return admin.firestore();
}