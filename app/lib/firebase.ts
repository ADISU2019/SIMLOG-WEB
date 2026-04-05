/**
 * SIMLOG-WEB
 * FIREBASE CLIENT INITIALIZATION
 * PURPOSE:
 * This file initializes the Firebase client services used by SIMLOG-WEB.
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

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDnoj8T6IckAiGJ1o3zAiL26CdLn8VcM0s",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "simlog-platform.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "simlog-platform",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "simlog-platform.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "600890920826",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:600890920826:web:10b572c2edbde0685ad0c3",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VLQWXZ5SMF",
};

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
   OPTIONAL DEV LOGGING
   ========================================================= */

if (process.env.NODE_ENV === "development") {
  console.log("🔥 Firebase runtime projectId:", app.options.projectId);
  console.log("🔥 Firebase runtime authDomain:", app.options.authDomain);
}