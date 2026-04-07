/**
 * SIMLOG-WEB
 * FIREBASE CLIENT INITIALIZATION
 * PURPOSE:
 * This file initializes the Firebase client services used by SIMLOG-WEB.
 * It also validates config values so the deployed app does not silently connect
 * to the wrong Firebase project.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

type FirebaseConfigShape = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const firebaseConfig: FirebaseConfigShape = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSyDnoj8T6IckAiGJ1o3zAiL26CdLn8VcM0s"),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "simlog-platform.firebaseapp.com"),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "simlog-platform"),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "simlog-platform.firebasestorage.app"),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "600890920826"),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:600890920826:web:10b572c2edbde0685ad0c3"),
  measurementId: getEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-VLQWXZ5SMF"),
};

function validateFirebaseConfig(config: FirebaseConfigShape) {
  const missing: string[] = [];

  if (!config.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!config.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!config.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!config.storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!config.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!config.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length > 0) {
    throw new Error(
      `Firebase config is incomplete. Missing: ${missing.join(", ")}`
    );
  }
}

validateFirebaseConfig(firebaseConfig);

/* =========================================================
   FIREBASE APP
   ========================================================= */

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* =========================================================
   ANALYTICS
   ========================================================= */

export let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  void isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase Analytics not available:", err);
      analytics = null;
    });
}

/* =========================================================
   AUTH / FIRESTORE / STORAGE
   ========================================================= */

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

/* =========================================================
   AUTH PERSISTENCE
   ========================================================= */

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence error:", err);
  });
}

/* =========================================================
   RUNTIME DEBUG LOGGING
   ========================================================= */

if (typeof window !== "undefined") {
  console.log("🔥 Firebase runtime projectId:", app.options.projectId);
  console.log("🔥 Firebase runtime authDomain:", app.options.authDomain);
  console.log("🔥 Firebase runtime storageBucket:", app.options.storageBucket);
}