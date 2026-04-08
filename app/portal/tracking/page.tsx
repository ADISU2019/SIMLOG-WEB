"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * TRACKING WORKSPACE HUB
 * URL: /portal/tracking
 */

type WorkspaceDoc = {
  name?: string;
  isActive?: boolean;
};

type WorkspaceItem = {
  id: string;
  name: string;
  isActive: boolean;
};

function Card({
  title,
  subtitle,
  href,
  gradient,
  icon,
  pill,
}: {
  title: string;
  subtitle: string;
  href: string;
  gradient: string;
  icon: React.ReactNode;
  pill?: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: 26,
          padding: 22,
          minHeight: 160,
          color: "white",
          background: gradient,
          boxShadow: "0 18px 46px rgba(0,0,0,0.14)",
          border: "1px solid rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: 18,
          transition: "transform 200ms ease, box-shadow 200ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 22px 60px rgba(0,0,0,0.18)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 18px 46px rgba(0,0,0,0.14)";
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {pill ? (
            <span
              style={{
                width: "fit-content",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: 0.3,
              }}
            >
              {pill}
            </span>
          ) : null}

          <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: 0.2 }}>
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.92,
              lineHeight: 1.5,
              maxWidth: 420,
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              marginTop: 8,
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 13,
              fontWeight: 950,
              letterSpacing: 0.2,
            }}
          >
            Open →
          </div>
        </div>

        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.22)",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
          aria-hidden="true"
        >
          <div style={{ fontSize: 34 }}>{icon}</div>
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 950 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000 }}>
        {value}
      </div>
    </div>
  );
}

export default function TrackingWorkspaceHubPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotice(null);

      try {
        const q = query(collection(db, "companies"), limit(50));
        const snap = await getDocs(q);

        if (cancelled) return;

        const items: WorkspaceItem[] = snap.docs.map((d) => {
          const data = d.data() as WorkspaceDoc;
          const nm = typeof data?.name === "string" ? data.name.trim() : "";
          return {
            id: d.id,
            name: nm || d.id,
            isActive: data?.isActive !== false,
          };
        });

        setWorkspaces(items);

        if (items.length === 0) {
          setNotice("No workspaces found in companies collection.");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load workspaces";
        setNotice(msg);
        setWorkspaces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalWorkspaces = useMemo(() => workspaces.length, [workspaces]);
  const activeWorkspaces = useMemo(
    () => workspaces.filter((w) => w.isActive).length,
    [workspaces]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      <section style={{ padding: "42px 18px 22px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 30,
              padding: 28,
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
                <div style={{ display: "grid", gap: 10, maxWidth: 820 }}>
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
                    Workspace Hub
                  </div>

                  <div style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6 }}>
                    Select a real company workspace first. Then open Trips,
                    Driver Flow, Fuel Reports, or Cashier.
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href="/"
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.24)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                        width: "fit-content",
                      }}
                    >
                      ← Back to Main Homepage
                    </Link>

                    <Link
                      href="/transiter-hub"
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.24)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                        width: "fit-content",
                      }}
                    >
                      ← Back to Transiter Hub
                    </Link>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
                  <MiniStat
                    label="Workspaces"
                    value={loading ? "Loading…" : String(totalWorkspaces)}
                  />
                  <MiniStat
                    label="Active"
                    value={loading ? "Loading…" : String(activeWorkspaces)}
                  />
                </div>
              </div>
            </div>
          </div>

          {notice && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(245,158,11,0.28)",
                background: "rgba(245,158,11,0.10)",
                fontSize: 14,
                fontWeight: 950,
                maxWidth: 1220,
              }}
            >
              Notice: {notice}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "0 18px 40px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 1000,
                letterSpacing: 0.2,
                color: "#0f172a",
              }}
            >
              Company Workspaces
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                opacity: 0.8,
                color: "#0f172a",
              }}
            >
              Pick a real company id from the companies collection. This fixes the
              bad `/tracking/tracking/tracking` route problem.
            </div>
          </div>

          {loading ? (
            <div
              style={{
                borderRadius: 22,
                padding: 20,
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
                fontWeight: 950,
              }}
            >
              Loading workspaces…
            </div>
          ) : workspaces.length === 0 ? (
            <div
              style={{
                borderRadius: 22,
                padding: 20,
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
                fontWeight: 950,
              }}
            >
              No company workspaces found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {workspaces.map((ws) => {
                const base = `/portal/tracking/${ws.id}`;
                return (
                  <Card
                    key={ws.id}
                    title={ws.name}
                    subtitle={`Company ID: ${ws.id} · ${
                      ws.isActive ? "Active" : "Inactive"
                    } · Open trips dashboard for this workspace.`}
                    href={`${base}/tracking`}
                    gradient="linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)"
                    icon="🚛"
                    pill={ws.isActive ? "Workspace" : "Inactive"}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}