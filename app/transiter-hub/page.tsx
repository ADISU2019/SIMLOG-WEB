// app/transiter-hub/page.tsx
// TRANSITER HUB PAGE
// PURPOSE:
// This page is the official entry hub for all registered transiters.
//
// WHAT THIS PAGE DOES:
// - loads active transiters from Firestore
// - lets users search registered transiters
// - provides sign-in and subscription entry points
// - helps users choose their transiter workspace before entering a dashboard
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Hero / transiter hub identity
// 2. Search and registered transiter listing
// 3. Hub information strip
// 4. Loading, empty, and result states
//
// ROUTE:
// /transiter-hub

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Transiter = {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  logoUrl?: string;
  description?: string;
  email?: string;
  phone?: string;
};

export default function TransiterHubPage() {
  const [transiters, setTransiters] = useState<Transiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadTransiters = async () => {
      try {
        setLoading(true);

        const transiterRef = collection(db, "transiters");
        const q = query(transiterRef, where("isActive", "==", true));
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transiter, "id">),
        }));

        data.sort((a, b) =>
          (a.name || a.slug || a.id || "").localeCompare(
            b.name || b.slug || b.id || ""
          )
        );

        setTransiters(data);
      } catch (error) {
        console.error("Error loading transiters:", error);
        setTransiters([]);
      } finally {
        setLoading(false);
      }
    };

    loadTransiters();
  }, []);

  const filteredTransiters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return transiters;

    return transiters.filter((t) => {
      const name = t.name?.toLowerCase() ?? "";
      const slug = t.slug?.toLowerCase() ?? "";
      const description = t.description?.toLowerCase() ?? "";
      return (
        name.includes(term) ||
        slug.includes(term) ||
        description.includes(term)
      );
    });
  }, [search, transiters]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =========================================================
          HERO / PAGE IDENTITY
         ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.18em] text-white/95 backdrop-blur transition hover:bg-white/15"
          >
            ← Back to Home
          </Link>

          <div className="mb-6 mt-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] backdrop-blur">
            Transiter Hub
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight md:text-6xl">
            Choose, Sign In, or Subscribe to Your Transiter Workspace
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-white/90 md:text-2xl">
            This is the official transiter entry hub. Existing transiters can
            choose their company and sign in, while new transiters can subscribe
            and create an account before entering their own dashboard.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-extrabold text-blue-700 shadow-lg transition hover:scale-[1.02]"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-lg font-extrabold text-white backdrop-blur transition hover:bg-white/15"
            >
              Subscribe as Transiter
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          HUB CONTENT
         ========================================================= */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
                Registered Transiters
              </h2>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Select your company below, then sign in and continue into your
                own customs preparation dashboard.
              </p>
            </div>

            <div className="w-full md:max-w-md">
              <label
                htmlFor="transiter-search"
                className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
              >
                Search transiters
              </label>
              <input
                id="transiter-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or slug..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* =========================================================
              INFO STRIP
             ========================================================= */}
          <div className="mb-10 rounded-3xl border border-blue-100 bg-blue-50 px-6 py-5">
            <p className="text-base font-medium leading-relaxed text-blue-900 md:text-lg">
              <span className="font-extrabold">Hub flow:</span> Choose your
              transiter company, sign in with your email and password, or
              subscribe as a new transiter. After authentication, continue into
              your own company dashboard.
            </p>
          </div>

          {/* =========================================================
              PAGE STATES
             ========================================================= */}
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[250px] animate-pulse rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
                >
                  <div className="mb-6 h-16 w-16 rounded-2xl bg-slate-200" />
                  <div className="mb-4 h-8 w-2/3 rounded bg-slate-200" />
                  <div className="mb-3 h-4 w-full rounded bg-slate-200" />
                  <div className="mb-3 h-4 w-5/6 rounded bg-slate-200" />
                  <div className="mt-8 h-12 w-40 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredTransiters.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
                🚛
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                No transiters found
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
                {search
                  ? "No registered transiter matched your search."
                  : "There are no active transiters available yet."}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-blue-700 px-8 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
                >
                  Register New Transiter
                </Link>

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-lg font-extrabold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredTransiters.map((transiter) => {
                const targetId = transiter.slug || transiter.id;

                return (
                  <div
                    key={transiter.id}
                    className="group flex min-h-[280px] flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div>
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {transiter.logoUrl ? (
                            <img
                              src={transiter.logoUrl}
                              alt={transiter.name || "Transiter logo"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">🏢</span>
                          )}
                        </div>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">
                          Active
                        </span>
                      </div>

                      <h3 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                        {transiter.name || "Unnamed Transiter"}
                      </h3>

                      <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                        {transiter.slug || transiter.id}
                      </p>

                      <p className="mt-5 text-lg leading-relaxed text-slate-600">
                        {transiter.description ||
                          "Professional customs preparation and transiter workspace for documents, tax simulation, and declaration building."}
                      </p>

                      {(transiter.email || transiter.phone) && (
                        <div className="mt-5 space-y-1 text-sm text-slate-500">
                          {transiter.email ? <p>{transiter.email}</p> : null}
                          {transiter.phone ? <p>{transiter.phone}</p> : null}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href={`/portal/${targetId}/dashboard`}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white transition hover:from-blue-700 hover:to-indigo-700"
                      >
                        Open Workspace
                      </Link>

                      <Link
                        href={`/auth/login?transiter=${encodeURIComponent(
                          targetId
                        )}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}