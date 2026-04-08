"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * TRACKING ENTRY (FIXED)
 *
 * PURPOSE:
 * - This page should NOT show demo companies
 * - It should immediately open dispatcher (tracking workspace)
 * - Keeps fallback UI if redirect fails
 */

// 🔴 IMPORTANT: CHANGE THIS TO YOUR REAL COMPANY ID
const DEFAULT_TRACKING_COMPANY_ID = "demo-company-1";
// Example:
// const DEFAULT_TRACKING_COMPANY_ID = "simara-logistics";

export default function TrackingEntryPage() {
  const router = useRouter();

  useEffect(() => {
    if (DEFAULT_TRACKING_COMPANY_ID) {
      router.replace(
        `/portal/tracking/${DEFAULT_TRACKING_COMPANY_ID}/tracking`
      );
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          borderRadius: 28,
          padding: 32,
          background:
            "linear-gradient(135deg, #0f766e 0%, #0ea5e9 45%, #7c3aed 100%)",
          color: "white",
          boxShadow: "0 22px 60px rgba(0,0,0,0.16)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "grid", gap: 12 }}>
          <span
            style={{
              width: "fit-content",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.24)",
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: 0.3,
            }}
          >
            TRACKING
          </span>

          <div
            style={{
              fontSize: 48,
              fontWeight: 1000,
              lineHeight: 1.1,
            }}
          >
            Dispatcher Workspace
          </div>

          <div
            style={{
              fontSize: 18,
              opacity: 0.95,
              lineHeight: 1.6,
            }}
          >
            Opening trips, drivers, cashier, and fuel management environment...
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/portal/tracking/${DEFAULT_TRACKING_COMPANY_ID}/tracking`}
            style={{
              textDecoration: "none",
              padding: "14px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.95)",
              color: "#0f172a",
              fontWeight: 1000,
              fontSize: 15,
            }}
          >
            Open Dispatcher →
          </Link>

          <Link
            href="/auth/login"
            style={{
              textDecoration: "none",
              padding: "14px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.24)",
              color: "white",
              fontWeight: 1000,
              fontSize: 15,
            }}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            style={{
              textDecoration: "none",
              padding: "14px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.24)",
              color: "white",
              fontWeight: 1000,
              fontSize: 15,
            }}
          >
            Subscribe
          </Link>
        </div>

        {/* NOTE */}
        <div
          style={{
            marginTop: 18,
            fontSize: 13,
            opacity: 0.8,
            fontWeight: 800,
          }}
        >
          If redirect does not happen automatically, click "Open Dispatcher".
        </div>
      </div>
    </main>
  );
}