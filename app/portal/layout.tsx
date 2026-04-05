import React from "react";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1220,
            margin: "0 auto",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Back to Workspaces navigation (no SIMLOG-WEB text) */}
          <Link
            href="/portal/tracking"
            style={{
              textDecoration: "none",
              fontWeight: 900,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            ← Workspaces
          </Link>

          {/* Motto */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 900,
              fontSize: 12,
              color: "rgba(15,23,42,0.55)",
            }}
          >
           Transparency. Efficiency• Accountability
          </div>
        </div>
      </header>

      {children}
    </>
  );
}