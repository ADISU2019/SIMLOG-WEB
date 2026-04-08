"use client";

import Link from "next/link";

/**
 * TRACKING ENTRY PAGE
 *
 * PURPOSE:
 * - do NOT auto-redirect
 * - let you see the tracking entry page during development
 * - allow manual navigation to dispatcher, sign in, or subscribe
 */

// Change this to your real tracking company ID when needed
const DEFAULT_TRACKING_COMPANY_ID = "demo-company-1";
// Example:
// const DEFAULT_TRACKING_COMPANY_ID = "simara-logistics";

function topLinkStyle(isPrimary = false): React.CSSProperties {
  return {
    textDecoration: "none",
    padding: "14px 18px",
    borderRadius: 18,
    fontWeight: 1000,
    fontSize: 15,
    border: isPrimary
      ? "1px solid rgba(255,255,255,0.22)"
      : "1px solid rgba(255,255,255,0.24)",
    background: isPrimary ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
    color: isPrimary ? "#0f172a" : "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function statCard(label: string, value: string): React.CSSProperties {
  return {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
    color: "#0f172a",
  };
}

export default function TrackingEntryPage() {
  const dispatcherHref = `/portal/tracking/${DEFAULT_TRACKING_COMPANY_ID}/tracking`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      <section style={{ padding: "90px 18px 28px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 30,
              padding: 30,
              border: "1px solid rgba(0,0,0,0.08)",
              background:
                "linear-gradient(135deg, #0f766e 0%, #0ea5e9 45%, #7c3aed 100%)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.16)",
              color: "white",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -40,
                background:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 35%, rgba(255,255,255,0.18), transparent 50%)",
              }}
              aria-hidden="true"
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 18,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "grid", gap: 12, maxWidth: 780 }}>
                  <span
                    style={{
                      width: "fit-content",
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      fontSize: 12,
                      fontWeight: 950,
                      letterSpacing: 0.35,
                    }}
                  >
                    TRACKING
                  </span>

                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 1000,
                      letterSpacing: 0.2,
                      lineHeight: 1.05,
                    }}
                  >
                    Dispatcher Workspace
                  </div>

                  <div style={{ fontSize: 17, opacity: 0.94, lineHeight: 1.6 }}>
                    Open the dispatcher environment for trips, drivers, cashier,
                    fuel accountability, and logistics reporting.
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link href="/" style={topLinkStyle()}>
                      ← Back to Main Homepage
                    </Link>

                    <Link href="/transiter-hub" style={topLinkStyle()}>
                      ← Back to Transiter Hub
                    </Link>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
                  <div style={statCard("Access", "Protected")}>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 950 }}>
                      Access
                    </div>
                    <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000 }}>
                      Protected
                    </div>
                  </div>

                  <div style={statCard("Default Company", DEFAULT_TRACKING_COMPANY_ID)}>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 950 }}>
                      Default Company
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 20,
                        fontWeight: 1000,
                        wordBreak: "break-word",
                      }}
                    >
                      {DEFAULT_TRACKING_COMPANY_ID}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 18px 44px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 1000,
                letterSpacing: 0.2,
                color: "#0f172a",
              }}
            >
              Continue
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                opacity: 0.8,
                color: "#0f172a",
              }}
            >
              Choose one option below.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}
          >
            <Link href="/auth/login" style={{ textDecoration: "none" }}>
              <div
                style={{
                  borderRadius: 26,
                  padding: 24,
                  minHeight: 170,
                  color: "white",
                  background:
                    "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)",
                  boxShadow: "0 18px 46px rgba(0,0,0,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  gap: 18,
                }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 30, fontWeight: 1000 }}>Sign In</div>
                  <div
                    style={{
                      fontSize: 15,
                      opacity: 0.94,
                      lineHeight: 1.6,
                      maxWidth: 420,
                    }}
                  >
                    Open your existing account and continue into your tracking
                    workspace.
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      width: "fit-content",
                      padding: "11px 15px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      fontSize: 14,
                      fontWeight: 950,
                    }}
                  >
                    Open →
                  </div>
                </div>

                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                    fontSize: 36,
                  }}
                >
                  🔐
                </div>
              </div>
            </Link>

            <Link href="/register" style={{ textDecoration: "none" }}>
              <div
                style={{
                  borderRadius: 26,
                  padding: 24,
                  minHeight: 170,
                  color: "white",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #14b8a6 48%, #0891b2 100%)",
                  boxShadow: "0 18px 46px rgba(0,0,0,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  gap: 18,
                }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 30, fontWeight: 1000 }}>Subscribe</div>
                  <div
                    style={{
                      fontSize: 15,
                      opacity: 0.94,
                      lineHeight: 1.6,
                      maxWidth: 420,
                    }}
                  >
                    Create a new account and register your company workspace for
                    tracking operations.
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      width: "fit-content",
                      padding: "11px 15px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      fontSize: 14,
                      fontWeight: 950,
                    }}
                  >
                    Open →
                  </div>
                </div>

                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                    fontSize: 36,
                  }}
                >
                  📝
                </div>
              </div>
            </Link>

            <Link href={dispatcherHref} style={{ textDecoration: "none" }}>
              <div
                style={{
                  borderRadius: 26,
                  padding: 24,
                  minHeight: 170,
                  color: "white",
                  background:
                    "linear-gradient(135deg, #111827 0%, #1e293b 55%, #0f172a 100%)",
                  boxShadow: "0 18px 46px rgba(0,0,0,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  gap: 18,
                }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 30, fontWeight: 1000 }}>
                    Open Dispatcher
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      opacity: 0.94,
                      lineHeight: 1.6,
                      maxWidth: 420,
                    }}
                  >
                    Open the trips dashboard directly for testing, trip creation,
                    driver access, cashier, and fuel reporting.
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      width: "fit-content",
                      padding: "11px 15px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      fontSize: 14,
                      fontWeight: 950,
                    }}
                  >
                    Open →
                  </div>
                </div>

                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                    fontSize: 36,
                  }}
                >
                  🚛
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}