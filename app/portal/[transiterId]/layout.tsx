// app/portal/[transiterId]/layout.tsx
// TRANSITER PORTAL LAYOUT
// PURPOSE:
// This layout provides the shared workspace shell for all transiter portal pages.
//
// WHAT THIS LAYOUT DOES:
// - renders the left sidebar for workspace identity and main navigation
// - renders the top workspace header for page context
// - keeps page descriptions and workflow guidance consistent
// - wraps all transiter dashboard, customer, and declaration pages
//
// MAIN AREAS IN THIS LAYOUT:
// 1. Left sidebar
// 2. Top workspace header
// 3. Mobile quick navigation
// 4. Main page body
//
// IMPORTANT:
// - the declarations route points to /declarations
// - sidebar workspace ID text is removed
// - top Subscribe button is removed because the dashboard already has a subscription card
// - sidebar top padding is added so text does not appear behind the global logo

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { useTenant } from "../../../hooks/useTenant";

const navItems = [
  {
    label: "Dashboard",
    href: (transiterId: string) => `/portal/${transiterId}/dashboard`,
    icon: "📊",
    section: "Main Control",
  },
  {
    label: "Customers",
    href: (transiterId: string) => `/portal/${transiterId}/customers`,
    icon: "👥",
    section: "Customer Workflow",
  },
  {
    label: "Declarations",
    href: (transiterId: string) => `/portal/${transiterId}/declarations`,
    icon: "🧾",
    section: "Final Preparation",
  },
];

export default function TransiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  const transiterId = String(params?.transiterId || "");
  const { tenant: transiter, loading } = useTenant(transiterId);

  const pageTitle = useMemo(() => {
    if (pathname?.includes("/customers/") && !pathname?.endsWith("/customers")) {
      return "Customer Workspace";
    }
    if (pathname?.includes("/customers")) {
      return "Customers Workspace";
    }
    if (pathname?.includes("/declarations")) {
      return "Declaration Workspace";
    }
    if (pathname?.includes("/dashboard")) {
      return "Transiter Dashboard";
    }
    return "Transiter Workspace";
  }, [pathname]);

  const pageDescription = useMemo(() => {
    if (pathname?.includes("/customers/") && !pathname?.endsWith("/customers")) {
      return "Work on one customer file, review documents, check tax preparation, and continue to declaration building.";
    }
    if (pathname?.includes("/customers")) {
      return "Manage customer records and open each customer workspace for documents, tax work, and declaration preparation.";
    }
    if (pathname?.includes("/declarations")) {
      return "Prepare structured declarations, review documents and containers, and continue toward CTP-ready submission files.";
    }
    if (pathname?.includes("/dashboard")) {
      return "Your main control center for customer management, document preparation, tax simulation, and declaration workflow.";
    }
    return "Reusable workspace for customs preparation and transiter operations.";
  }, [pathname]);

  const workspaceSummary = useMemo(() => {
    if (pathname?.includes("/dashboard")) {
      return "Use the dashboard to enter the main business modules and monitor current workflow activity.";
    }
    if (pathname?.includes("/customers")) {
      return "Customer records are the bridge between uploaded documents, tax preparation, and declaration building.";
    }
    if (pathname?.includes("/declarations")) {
      return "The declaration workspace is the final structured preparation area before submission readiness.";
    }
    return "This workspace is shared across all transiters with branding and data loaded dynamically.";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="hidden w-80 flex-col border-r border-slate-200 bg-white pt-40 xl:flex">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/" className="block">
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
                SIMARAN Technologies
              </p>
            </Link>
            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-500">
              Reusable customs preparation platform for all registered transiters.
            </p>
          </div>

          {/* Workspace Identity */}
          <div className="border-b border-slate-200 px-6 py-8">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">
              Active Workspace
            </p>

            {loading ? (
              <div className="animate-pulse">
                <div className="mb-4 h-20 w-20 rounded-3xl bg-slate-200" />
                <div className="mb-3 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-5/6 rounded bg-slate-200" />
              </div>
            ) : (
              <>
                <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                  {transiter?.logoUrl ? (
                    <img
                      src={transiter.logoUrl}
                      alt={transiter?.name || "Transiter logo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🏢</span>
                  )}
                </div>

                <p className="mt-4 text-base font-medium leading-relaxed text-slate-600">
                  {transiter?.description ||
                    "Reusable customs preparation workspace with dynamic branding, customer workflow, and declaration tools."}
                </p>

                {(transiter?.email || transiter?.phone) && (
                  <div className="mt-5 space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      Contact Details
                    </p>
                    {transiter?.email ? (
                      <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                        {transiter.email}
                      </p>
                    ) : null}
                    {transiter?.phone ? (
                      <p className="text-sm font-semibold text-slate-700">
                        {transiter.phone}
                      </p>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <p className="px-3 pb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
              Main Navigation
            </p>

            <div className="space-y-2">
              {navItems.map((item) => {
                const href = item.href(transiterId);
                const active = pathname === href;

                return (
                  <Link key={item.label} href={href}>
                    <div
                      className={`rounded-2xl px-4 py-4 transition ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-base font-extrabold">{item.label}</p>
                          <p
                            className={`text-xs font-bold uppercase tracking-[0.18em] ${
                              active ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            {item.section}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Action */}
          <div className="border-t border-slate-200 px-6 py-6">
            <Link href="/transiter-hub">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 transition hover:text-blue-800">
                <span>←</span>
                <span>Back to Transiter Hub</span>
              </div>
            </Link>
          </div>
        </aside>

        {/* ================= RIGHT MAIN AREA ================= */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                    {transiter?.logoUrl ? (
                      <img
                        src={transiter.logoUrl}
                        alt={transiter?.name || "Transiter logo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">🏢</span>
                    )}
                  </div>

                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                      {pageTitle}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/portal/${transiterId}/dashboard`}>
                    <div className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50">
                      Dashboard
                    </div>
                  </Link>

                  <Link href={`/portal/${transiterId}/customers`}>
                    <div className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700">
                      Open Customers
                    </div>
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-5">
                <p className="text-lg font-semibold leading-relaxed text-slate-700 md:text-xl">
                  {pageDescription}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-6 py-5">
                <p className="text-base font-semibold leading-relaxed text-slate-600 md:text-lg">
                  <span className="font-extrabold text-slate-900">
                    Workspace Guidance:
                  </span>{" "}
                  {workspaceSummary}
                </p>
              </div>

              <div className="xl:hidden">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Quick Navigation
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {navItems.map((item) => {
                    const href = item.href(transiterId);
                    const active = pathname === href;

                    return (
                      <Link key={item.label} href={href}>
                        <div
                          className={`rounded-2xl px-4 py-4 text-sm font-extrabold transition ${
                            active
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}