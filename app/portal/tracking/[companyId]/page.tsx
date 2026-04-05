// app/portal/tracking/[companyId]/page.tsx
import Link from "next/link";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * =========================================================
 * TRACKING WORKSPACE HUB (Independent Module) — STABLE
 * =========================================================
 * URL:
 *   /portal/tracking/[companyId]
 *
 * Data:
 *   companies/{companyId}
 * =========================================================
 */

type WorkspaceDoc = {
  name?: string;
  isActive?: boolean;
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

          <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: 0.2 }}>{title}</div>
          <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5, maxWidth: 420 }}>{subtitle}</div>

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
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 950 }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

export default async function TrackingWorkspaceHubPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  // ✅ Next 16: params is a Promise → MUST await
  const { companyId: rawCompanyId } = await params;
  const companyId = String(rawCompanyId ?? "").trim();

  if (!companyId) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 26, fontWeight: 1000 }}>Missing companyId in URL</div>
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            Go back to Workspaces and select your company.
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/portal/tracking" style={{ fontWeight: 950 }}>
              ← Back to Workspaces
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let workspaceName = "Tracking Workspace";
  let notice: string | null = null;

  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection("companies").doc(companyId).get();

    if (!snap.exists) {
      notice = "Workspace not found in companies collection.";
    } else {
      const data = snap.data() as WorkspaceDoc;
      const nm = typeof data?.name === "string" ? data.name.trim() : "";
      workspaceName = nm || "Tracking Workspace";

      if (data?.isActive === false) {
        notice = "This workspace is not active (isActive: false).";
      }
    }
  } catch (e: unknown) {
    notice = e instanceof Error ? e.message : "Failed to load workspace.";
  }

  const base = `/portal/tracking/${companyId}`;
  const routes = {
    dispatcher: `${base}/tracking`,
    driver: `${base}/driver`,
    fuel: `${base}/reports/fuel`,
    trucks: `${base}/tracking`,
    drivers: `${base}/tracking`,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      {/* HERO */}
      <section style={{ padding: "42px 18px 22px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 30,
              padding: 28,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #0f766e 0%, #0ea5e9 45%, #7c3aed 100%)",
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
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

                  <div style={{ fontSize: 56, fontWeight: 1000, letterSpacing: 0.2, lineHeight: 1.05 }}>
                    Workspace Hub
                  </div>

                  <div style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6 }}>
                    Choose what you want to manage in this workspace (Trips · Drivers · Fuel · Reports).
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                      }}
                    >
                      ← Back to Main Homepage
                    </Link>

                    <Link
                      href="/portal/tracking"
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.24)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      ← Back to Workspaces
                    </Link>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
                  <MiniStat label="Workspace" value={workspaceName} />
                  <MiniStat label="Company ID" value={companyId} />
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

      {/* CARDS */}
      <section style={{ padding: "0 18px 40px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: 0.2, color: "#0f172a" }}>
              Workspace Modules
            </div>
            <div style={{ marginTop: 6, fontSize: 15, opacity: 0.8, color: "#0f172a" }}>
              Choose where you want to go next.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <Card
              title="Trips Dashboard"
              subtitle="Dispatcher view: create trips, view statuses, check-ins, fuel summary and costs."
              href={routes.dispatcher}
              gradient="linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)"
              icon="🚛"
              pill="Dispatcher"
            />

            <Card
              title="Driver Flow"
              subtitle="Find trip by code → start → check-in + fuel → complete."
              href={routes.driver}
              gradient="linear-gradient(135deg, #10b981 0%, #22c55e 45%, #14b8a6 100%)"
              icon="👤"
              pill="Driver"
            />

            <Card
              title="Fuel Reports"
              subtitle="Run fuel accountability report (DD-MM-YYYY) with totals and flags."
              href={routes.fuel}
              gradient="linear-gradient(135deg, #f97316 0%, #f59e0b 55%, #fb7185 100%)"
              icon="⛽"
              pill="Phase 4"
            />

            <Card
              title="Trucks & Drivers"
              subtitle="Manage trucks/drivers. If you don’t have separate pages yet, use the Trips Dashboard."
              href={routes.dispatcher}
              gradient="linear-gradient(135deg, #111827 0%, #374151 55%, #0f172a 100%)"
              icon="🗂️"
              pill="Setup"
            />
          </div>

          <div style={{ marginTop: 16, fontSize: 13, opacity: 0.75, color: "#0f172a", lineHeight: 1.6 }}>
            Tip: If you add dedicated Trucks/Drivers pages later, update the routes mapping once.
          </div>
        </div>
      </section>
    </main>
  );
}