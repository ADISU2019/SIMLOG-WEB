// app/portal/[transiterId]/dashboard/page.tsx
// TRANSITER DASHBOARD HOME PAGE
// PURPOSE:
// This page is the main control center for one transiter workspace.
//
// WHAT THIS PAGE DOES:
// - presents the main business modules used by the transiter
// - gives a quick overview of current operational activity
// - guides the user through the recommended customs preparation workflow
// - acts as the entry point into customers, documents, tax work, and declarations
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Dashboard identity
// 2. Main business modules
// 3. Operational summary
// 4. Recommended workflow
// 5. Recent workspace activity
//
// ROUTE:
// /portal/[transiterId]/dashboard

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

export default function TransiterDashboardHomePage() {
  const params = useParams();
  const transiterId = String(params?.transiterId || "");

  const quickStats = useMemo(
    () => [
      {
        label: "Active Customers",
        value: "24",
        note: "Customer records currently active in this transiter workspace.",
        color: "from-blue-50 to-blue-100 border-blue-100 text-blue-800",
      },
      {
        label: "Draft Declarations",
        value: "08",
        note: "Declarations still being prepared before final submission.",
        color:
          "from-amber-50 to-yellow-100 border-yellow-100 text-amber-800",
      },
      {
        label: "Stored Documents",
        value: "126",
        note: "Uploaded files available across the customer workflow.",
        color:
          "from-emerald-50 to-lime-100 border-emerald-100 text-emerald-800",
      },
      {
        label: "Pending Submissions",
        value: "05",
        note: "Cases that may be ready for CTP preparation and submission.",
        color:
          "from-violet-50 to-fuchsia-100 border-violet-100 text-violet-800",
      },
    ],
    []
  );

  const modules = useMemo(
    () => [
      {
        title: "Document Vault",
        subtitle: "Store and organize files",
        description:
          "Open customer-linked document workflows to upload, review, and manage customs preparation files.",
        href: `/portal/${transiterId}/customers`,
        icon: "📄",
        badge: "Core Module",
        gradient: "from-blue-600 via-indigo-600 to-blue-700",
        shadow: "shadow-[0_20px_60px_rgba(37,99,235,0.28)]",
      },
      {
        title: "Customers",
        subtitle: "Create and manage customer records",
        description:
          "Maintain importer and exporter records, open customer workspaces, and continue operational preparation from one place.",
        href: `/portal/${transiterId}/customers`,
        icon: "👥",
        badge: "Workspace",
        gradient: "from-emerald-600 via-teal-600 to-green-700",
        shadow: "shadow-[0_20px_60px_rgba(16,185,129,0.28)]",
      },
      {
        title: "Tax Simulation",
        subtitle: "Estimate customs taxes",
        description:
          "Open customer-centered tax workflows to estimate duties, VAT, surtax, and other costs before final declaration preparation.",
        href: `/portal/${transiterId}/customers`,
        icon: "💰",
        badge: "Financial Tool",
        gradient: "from-amber-500 via-orange-500 to-yellow-500",
        shadow: "shadow-[0_20px_60px_rgba(245,158,11,0.28)]",
      },
      {
        title: "Declaration Builder for CTP",
        subtitle: "Prepare structured submission files",
        description:
          "Review existing declaration records, continue draft work, and move cases toward final CTP submission readiness.",
        href: `/portal/${transiterId}/declarations`,
        icon: "🧾",
        badge: "Final Workflow",
        gradient: "from-violet-600 via-fuchsia-600 to-purple-700",
        shadow: "shadow-[0_20px_60px_rgba(139,92,246,0.28)]",
      },
    ],
    [transiterId]
  );

  const activities = useMemo(
    () => [
      "Customer profile opened for customs preparation workflow.",
      "Document package uploaded and stored in the workspace.",
      "Tax simulation prepared for declaration review.",
      "Declaration draft updated and saved for final submission.",
    ],
    []
  );

  return (
    <div className="space-y-10">
      {/* ================= DASHBOARD HERO ================= */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-blue-700">
              Transiter Control Center
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Transiter Dashboard
            </h1>

            <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-600 md:text-2xl">
              Welcome to your main customs preparation workspace. From here you
              can manage customers, organize documents, estimate taxes, and
              prepare structured declarations for CTP.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-7 text-white shadow-[0_20px_60px_rgba(79,70,229,0.30)] lg:max-w-sm">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl shadow-lg">
                  🚛
                </div>

                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em]">
                  Active Workspace
                </div>
              </div>

              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-white/85">
                Workspace ID
              </p>

              <p className="mt-3 break-all text-2xl font-extrabold leading-tight">
                {transiterId || "transiter"}
              </p>

              <p className="mt-4 text-base font-semibold leading-relaxed text-white/90">
                This dashboard is the main entry point into your company
                workflow for customers, documents, tax preparation, and
                declaration readiness.
              </p>

              <Link href={`/portal/${transiterId}/customers`}>
                <div className="mt-6 inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/20 bg-white/15 px-5 py-3 text-sm font-extrabold backdrop-blur-sm transition hover:bg-white/20">
                  <span>Open Customers</span>
                  <span className="text-lg">→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN BUSINESS MODULES ================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">
            Main Business Modules
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Choose the Main Function You Want to Work On
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These are the main modules used in the customs preparation process.
            Start with customers and documents, then continue to tax simulation
            and declaration preparation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <div
                className={`group relative h-full cursor-pointer overflow-hidden rounded-[2rem] bg-gradient-to-br ${module.gradient} p-8 text-white ${module.shadow} transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(15,23,42,0.20)] md:p-10`}
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">
                  <div className="mb-8 flex items-center justify-between gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg ring-1 ring-white/20">
                      {module.icon}
                    </div>

                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.2em]">
                      {module.badge}
                    </div>
                  </div>

                  <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white/80">
                    {module.subtitle}
                  </p>

                  <h3 className="mb-5 text-3xl font-extrabold leading-tight md:text-4xl">
                    {module.title}
                  </h3>

                  <p className="mb-8 text-xl font-semibold leading-relaxed text-white/95">
                    {module.description}
                  </p>

                  <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/15 px-6 py-3 backdrop-blur-sm">
                    <span className="text-lg font-extrabold">Open Module</span>
                    <span
                      aria-hidden="true"
                      className="text-xl transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= OPERATIONAL SUMMARY ================= */}
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
            Operational Summary
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Current Workspace Activity at a Glance
          </h2>
          <p className="mt-3 max-w-4xl text-xl font-semibold leading-relaxed text-slate-600">
            These summary cards provide a quick operational view across
            customers, declarations, stored files, and pending submission work.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-[1.75rem] border bg-gradient-to-br p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${stat.color}`}
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.2em]">
                {stat.label}
              </p>
              <p className="mt-4 text-5xl font-extrabold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-700">
                {stat.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WORKFLOW + ACTIVITY ================= */}
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-violet-700">
            Recommended Workflow
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Best Order to Use the Platform
          </h2>

          <div className="mt-8 grid gap-5">
            {[
              {
                step: "01",
                title: "Open or create a customer",
                text: "Start with the customer record because documents, tax work, and declarations are usually prepared for a specific customer.",
              },
              {
                step: "02",
                title: "Upload and organize documents",
                text: "Store invoices, customs files, and supporting business documents in the document workflow.",
              },
              {
                step: "03",
                title: "Run tax simulation",
                text: "Estimate taxes before final declaration preparation so values and costs are clearer.",
              },
              {
                step: "04",
                title: "Build the declaration for CTP",
                text: "Prepare the structured declaration package and continue toward final submission readiness.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-extrabold text-white shadow-md">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-lg font-semibold leading-relaxed text-slate-600">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-700">
            Recent Workspace Activity
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Latest Updates
          </h2>

          <div className="mt-8 space-y-4">
            {activities.map((activity, index) => (
              <div
                key={`${activity}-${index}`}
                className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-extrabold text-blue-700">
                    ✓
                  </div>
                  <p className="text-lg font-semibold leading-relaxed text-slate-700">
                    {activity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
            <p className="text-lg font-semibold leading-relaxed text-blue-900">
              This dashboard works as your professional control center. The main
              work continues inside customer records and declaration pages.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}