// app/page.tsx
// MAIN PLATFORM HOMEPAGE
// PURPOSE:
// This page is the public landing page for the SIMARAN Technologies platform.
//
// WHAT THIS PAGE DOES:
// - introduces the platform vision and main business purpose
// - gives users the main entry points into the system
// - routes users to the Transiter Hub workspace or Tracking workspace
// - presents the platform story, capabilities, and navigation
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Hero section
// 2. Government / compliance stripe
// 3. Platform vision
// 4. Core capabilities
// 5. Workspace entry cards
// 6. About the platform
// 7. Footer
//
// ROUTE:
// /

"use client";

import Link from "next/link";
import Head from "next/head";

export default function HomePage() {
  const transiterHubHref = "/transiter-hub";

  return (
    <>
      <Head>
        <title>SIMARAN TECHNOLOGIES | Main Homepage</title>
        <meta
          name="description"
          content="SIMARAN Technologies — Ethiopia’s Digital Customs, Transiter & Tracking Platform"
        />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden px-6 py-20 text-white md:py-24">
          <div className="absolute inset-0">
            <img
              src="/ethiopia-flag.jpg"
              alt="Ethiopian Flag"
              className="h-full w-full object-cover opacity-40"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-blue-900/65 to-black/75" />

          <div className="relative z-10 mx-auto max-w-7xl">
            {/* ===== WELCOME ABOVE CARDS ===== */}
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl xl:text-7xl">
                Welcome to FANTAYE PLATFORMS
              </h1>
            </div>

            <div className="flex flex-col gap-10 md:flex-row md:items-start">
              {/* ===== LOGO LEFT ===== */}
              <div className="flex-shrink-0">
                <Link href="/">
                  <div className="inline-flex cursor-pointer items-center rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                    
                  </div>
                </Link>
              </div>

              {/* ===== CARDS RIGHT ===== */}
              <div className="grid flex-1 gap-6 md:grid-cols-2">
                {/* ADMIN LOGIN CARD */}
                <div
                  className="rounded-[2rem] border border-white/15 bg-gradient-to-br from-fuchsia-600 via-indigo-600 to-cyan-500
                  p-8 text-white shadow-[0_20px_60px_rgba(79,70,229,0.40)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-3xl">🔐</div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                      Admin
                    </div>
                  </div>

                  <h3 className="mb-3 text-2xl font-extrabold md:text-3xl">
                    Admin Access
                  </h3>

                  <p className="mb-6 text-sm font-semibold leading-relaxed text-white/90 md:text-base">
                    Secure platform control, monitoring, and configuration for
                    administration and oversight.
                  </p>

                  <Link href="/auth/login">
                    <div className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-3 font-extrabold text-indigo-700 transition-all hover:scale-105">
                      Admin Login →
                    </div>
                  </Link>
                </div>

                {/* DEDICATION CARD */}
                <div
                  className="rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-100
                  p-8 shadow-[0_20px_60px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-black">
                      
                    </div>
                  </div>

                  <h3 className="mb-4 text-2xl font-extrabold text-gray-900 md:text-3xl">
                    Tribute
                  </h3>

                  <p className="text-sm leading-relaxed text-gray-900 italic md:text-base">
                    This platform is lovingly dedicated to our mother,the
                    mother of humanity, Ms. Fantaye Jinfesa, and to all
                    mothers who give everything so their children may live,
                    grow, and rise.
                    <br />
                    <br />
                    Our mother was the foundation of who we are today. Through
                    her strength, sacrifice, and unconditional love, she shaped
                    our path and gave us purpose.
                    <br />
                    <br />
                    We, your children, carry your legacy forward with pride,
                    gratitude, and honor.
                    <br />
                    <br />
                    <span className="font-semibold not-italic text-gray-900">
                      You are remembered forever.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= GOVERNMENT STRIPE ================= */}
        <section className="bg-yellow-100 py-4 text-center text-lg font-bold text-yellow-900 md:text-xl">
          🇪🇹 Regulatory Alignment — Designed in Alignment with Ethiopian Customs
          (ERCA) Digital Standards
        </section>

        <div className="h-20 bg-gradient-to-b from-blue-900 to-gray-50" />

        {/* ================= VISION ================= */}
        <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 py-28 text-center text-white">
          <p className="mb-6 text-lg font-bold uppercase tracking-[0.3em] opacity-80">
            Platform Vision
          </p>
          <h2 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            Come Grow With Us
          </h2>
          <p className="mx-auto max-w-4xl text-2xl font-semibold leading-relaxed opacity-95 md:text-3xl">
            Whether you are a transiter, importer, or logistics startup,
            SIMLOG-WEB is your digital backbone.
          </p>
        </section>

        {/* ================= CORE CAPABILITIES ================= */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <p className="mb-4 text-lg font-bold uppercase tracking-[0.25em] text-blue-700">
              Core Capabilities
            </p>

            <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl">
              One Platform for the Main Customs Preparation Workflow
            </h2>

            <p className="mx-auto mb-16 max-w-5xl text-2xl font-semibold leading-relaxed text-gray-600 md:text-3xl">
              Professional-grade modules built to support customs preparation,
              logistics operations, and transiter business workflows in one
              platform.
            </p>

            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              <div
                className="group flex min-h-[360px] flex-col justify-between rounded-[2rem] border border-blue-100
                bg-gradient-to-br from-blue-50 via-white to-blue-100 p-10 text-left shadow-[0_16px_40px_rgba(37,99,235,0.10)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(37,99,235,0.18)]"
              >
                <div>
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-4xl text-white shadow-lg">
                    📄
                  </div>
                  <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                    Secure Records
                  </p>
                  <h3 className="mb-5 text-4xl font-extrabold leading-tight text-blue-800">
                    Document Management
                  </h3>
                  <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                    Upload, organize, and securely store customs and logistics
                    documents in one place.
                  </p>
                </div>
              </div>

              <div
                className="group flex min-h-[360px] flex-col justify-between rounded-[2rem] border border-emerald-100
                bg-gradient-to-br from-emerald-50 via-white to-lime-100 p-10 text-left shadow-[0_16px_40px_rgba(16,185,129,0.10)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(16,185,129,0.18)]"
              >
                <div>
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl text-white shadow-lg">
                    💰
                  </div>
                  <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-600">
                    Smart Estimation
                  </p>
                  <h3 className="mb-5 text-4xl font-extrabold leading-tight text-emerald-800">
                    Tax Simulation
                  </h3>
                  <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                    Calculate duties, VAT, surtax, and excise instantly using HS
                    codes and customs tax logic.
                  </p>
                </div>
              </div>

              <div
                className="group flex min-h-[360px] flex-col justify-between rounded-[2rem] border border-violet-100
                bg-gradient-to-br from-violet-50 via-white to-fuchsia-100 p-10 text-left shadow-[0_16px_40px_rgba(139,92,246,0.10)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(139,92,246,0.18)]"
              >
                <div>
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-600 text-4xl text-white shadow-lg">
                    🚛
                  </div>
                  <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-violet-600">
                    Reusable Workspaces
                  </p>
                  <h3 className="mb-5 text-4xl font-extrabold leading-tight text-violet-800">
                    Transiter Portals
                  </h3>
                  <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                    Dedicated workspaces for registered transit companies to
                    manage customers, declarations, and operations.
                  </p>
                </div>
              </div>

              <div
                className="group flex min-h-[360px] flex-col justify-between rounded-[2rem] border border-cyan-100
                bg-gradient-to-br from-cyan-50 via-white to-teal-100 p-10 text-left shadow-[0_16px_40px_rgba(13,148,136,0.10)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(13,148,136,0.18)]"
              >
                <div>
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-600 text-4xl text-white shadow-lg">
                    📍
                  </div>
                  <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.2em] text-teal-600">
                    Operations Control
                  </p>
                  <h3 className="mb-5 text-4xl font-extrabold leading-tight text-teal-800">
                    Tracking & Dispatch
                  </h3>
                  <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                    Monitor trips, drivers, vehicles, fuel accountability, and
                    logistics reporting from one operational workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WORKSPACE ENTRY ================= */}
        <section id="workspace" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-4 text-lg font-bold uppercase tracking-[0.25em] text-indigo-700">
              Platform Entry
            </p>

            <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl">
              Choose Your Workspace
            </h2>

            <p className="mx-auto mb-16 max-w-5xl text-2xl font-semibold leading-relaxed text-gray-600 md:text-3xl">
              Select the environment you want to enter. Use the Transiter Hub
              for customs and customer workflows, or open the Tracking
              Workspace for dispatcher and fleet operations.
            </p>

            <div className="grid gap-10 md:grid-cols-2">
              <Link href={transiterHubHref}>
                <div
                  className="group h-full cursor-pointer rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600
                  p-10 text-left text-white shadow-[0_20px_60px_rgba(79,70,229,0.28)] transition-all duration-300
                  hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(79,70,229,0.4)]"
                >
                  <div className="mb-8 flex items-center justify-between gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg ring-1 ring-white/20">
                      🚛
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-extrabold uppercase tracking-[0.2em]">
                      Main Entry
                    </div>
                  </div>

                  <h3 className="mb-5 text-4xl font-extrabold md:text-5xl">
                    Transiter Hub
                  </h3>

                  <p className="mb-6 text-2xl font-semibold leading-relaxed text-white/95">
                    Go to the official transiter entry hub to choose your
                    company, sign in, subscribe, and continue into your own
                    dashboard.
                  </p>

                  <p className="mb-8 text-lg font-bold text-white/80 md:text-xl">
                    Choose Company · Sign In · Subscribe · Dashboard
                  </p>

                  <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/15 px-6 py-3">
                    <span className="text-xl font-extrabold">Enter Hub</span>
                    <span
                      aria-hidden="true"
                      className="text-xl transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>

              <Link href="/portal/tracking">
                <div
                  className="group h-full cursor-pointer rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700
                  p-10 text-left text-white shadow-[0_20px_60px_rgba(16,185,129,0.28)] transition-all duration-300
                  hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(16,185,129,0.4)]"
                >
                  <div className="mb-8 flex items-center justify-between gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg ring-1 ring-white/20">
                      📍
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-extrabold uppercase tracking-[0.2em]">
                      Operations
                    </div>
                  </div>

                  <h3 className="mb-5 text-4xl font-extrabold md:text-5xl">
                    Tracking Workspace
                  </h3>

                  <p className="mb-6 text-2xl font-semibold leading-relaxed text-white/95">
                    Open the dispatcher environment for trips, drivers, fleet
                    activity, fuel accountability, and logistics reporting.
                  </p>

                  <p className="mb-8 text-lg font-bold text-white/80 md:text-xl">
                    Trips · Drivers · Vehicles · Fuel · Reports
                  </p>

                  <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/15 px-6 py-3">
                    <span className="text-xl font-extrabold">
                      Open Tracking
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xl transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            <div className="mt-12 text-lg font-semibold text-gray-500 md:text-xl">
              <span className="font-extrabold">Note:</span> Transiter dashboards
              are tenant-based and accessed through the hub. Tracking remains an
              independent operational workspace.
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}
        <section className="bg-green-100 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-center text-lg font-bold uppercase tracking-[0.25em] text-green-700">
              Platform Story
            </p>

            <h2
              className="mb-20 bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-center
              text-5xl font-extrabold tracking-tight text-transparent md:text-7xl"
            >
              About the Platform
            </h2>

            <div className="grid gap-16 text-center md:grid-cols-3">
              <div className="rounded-[2rem] bg-white/70 p-10 shadow-lg">
                <h3
                  className="mb-6 bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text
                  text-4xl font-extrabold tracking-tight text-transparent md:text-5xl"
                >
                  Our History
                </h3>
                <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                  FANTAYE PLATFORMS was born from real logistics operations in
                  Ethiopia, beginning with SIMARAN Logistics, bridging private
                  transiters and government customs systems.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white/70 p-10 shadow-lg">
                <h3
                  className="mb-6 bg-gradient-to-r from-green-700 to-teal-500 bg-clip-text
                  text-4xl font-extrabold tracking-tight text-transparent md:text-5xl"
                >
                  Who We Are
                </h3>
                <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                  A digital logistics innovation platform empowering transit
                  companies and importers with automation, transparency,
                  compliance, and smart customs preparation tools.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white/70 p-10 shadow-lg">
                <h3
                  className="mb-6 bg-gradient-to-r from-green-700 to-lime-500 bg-clip-text
                  text-4xl font-extrabold tracking-tight text-transparent md:text-5xl"
                >
                  What We Do
                </h3>
                <p className="text-2xl font-semibold leading-relaxed text-gray-700">
                  We manage trade documents, simulate customs taxes, prepare
                  structured declarations, automate workflows aligned with ERCA
                  Trade Portal standards, and support tracking and dispatch
                  operations for trips, drivers, vehicles, and fuel
                  accountability.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 py-10 text-center text-white">
          <div className="mb-2 text-sm font-bold uppercase tracking-[0.25em] opacity-50">
            Platform Navigation
          </div>
          <p className="text-lg font-semibold opacity-70">
            © {new Date().getFullYear()} SIMLOG-WEB Platform. All rights
            reserved.
          </p>
        </footer>
      </main>
    </>
  );
}