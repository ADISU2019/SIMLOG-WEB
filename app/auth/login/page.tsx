// app/auth/login/page.tsx
// TRANSITER LOGIN PAGE
// PURPOSE:
// This page allows a registered transiter user to sign in and enter
// their own company dashboard.
//
// WHAT THIS PAGE DOES:
// - accepts transiter slug or ID
// - accepts email and password
// - previews the selected transiter workspace
// - signs the user in with Firebase Auth
// - redirects the user to their own transiter dashboard
//
// MAIN SECTIONS ON THIS PAGE:
// 1. Hero / page identity
// 2. Login form
// 3. Workspace preview
// 4. Selected transiter summary
//
// ROUTE:
// /auth/login

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Transiter = {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  logoUrl?: string;
  description?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const transiterParam = searchParams.get("transiter") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [transiterInput, setTransiterInput] = useState(transiterParam);

  const [selectedTransiter, setSelectedTransiter] = useState<Transiter | null>(
    null
  );
  const [loadingTransiter, setLoadingTransiter] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setTransiterInput(transiterParam);
  }, [transiterParam]);

  useEffect(() => {
    const loadTransiter = async () => {
      const term = transiterInput.trim();

      if (!term) {
        setSelectedTransiter(null);
        return;
      }

      try {
        setLoadingTransiter(true);
        setError("");

        const bySlugQuery = query(
          collection(db, "transiters"),
          where("slug", "==", term),
          where("isActive", "==", true),
          limit(1)
        );

        const bySlugSnap = await getDocs(bySlugQuery);

        if (!bySlugSnap.empty) {
          const doc = bySlugSnap.docs[0];
          setSelectedTransiter({
            id: doc.id,
            ...(doc.data() as Omit<Transiter, "id">),
          });
          return;
        }

        const byIdQuery = query(
          collection(db, "transiters"),
          where("isActive", "==", true),
          limit(50)
        );

        const byIdSnap = await getDocs(byIdQuery);
        const found = byIdSnap.docs.find((doc) => doc.id === term);

        if (found) {
          setSelectedTransiter({
            id: found.id,
            ...(found.data() as Omit<Transiter, "id">),
          });
        } else {
          setSelectedTransiter(null);
        }
      } catch (err) {
        console.error("Error loading transiter:", err);
        setSelectedTransiter(null);
      } finally {
        setLoadingTransiter(false);
      }
    };

    loadTransiter();
  }, [transiterInput]);

  const transiterLabel = useMemo(() => {
    if (!selectedTransiter) return transiterInput;
    return (
      selectedTransiter.name || selectedTransiter.slug || selectedTransiter.id
    );
  }, [selectedTransiter, transiterInput]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedEmail = email.trim();
    const normalizedTransiter = transiterInput.trim();

    if (!normalizedTransiter) {
      setError("Please enter your transiter ID or slug.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setSigningIn(true);

      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, normalizedEmail, password);

      const targetId =
        selectedTransiter?.slug || selectedTransiter?.id || normalizedTransiter;

      setSuccessMessage("Login successful. Opening your transiter dashboard...");
      router.push(`/portal/${targetId}/dashboard`);
    } catch (err: any) {
      console.error("Login error:", err);

      if (err?.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err?.code === "auth/user-not-found") {
        setError("No user found with that email.");
      } else if (err?.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-6 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            href="/transiter-hub"
            className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.18em] text-white/95 backdrop-blur transition hover:bg-white/15"
          >
            ← Back to Transiter Hub
          </Link>

          <div className="mb-6 mt-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] backdrop-blur">
            Transiter Login
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight md:text-6xl">
            Sign In to Your Transiter Dashboard
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/90 md:text-2xl">
            Sign in with your transiter company, email, and password to access
            your own customs preparation workspace.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                Login
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Enter your transiter, email, and password to open your
                dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="transiter"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Transiter ID or Slug
                </label>
                <input
                  id="transiter"
                  type="text"
                  value={transiterInput}
                  onChange={(e) => setTransiterInput(e.target.value)}
                  placeholder="e.g. simaran or awash"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-2 text-sm text-slate-500">
                  This tells the platform which transiter workspace to open.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={signingIn}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {signingIn ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-slate-600">
                New transiter?{" "}
                <Link
                  href="/register"
                  className="font-extrabold text-blue-700 hover:text-blue-800"
                >
                  Subscribe here
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-extrabold text-slate-900">
                Workspace Preview
              </h3>
              <p className="mt-3 text-slate-600">
                Once you sign in, you enter the same reusable transiter
                workspace used by all registered transiters.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl bg-blue-50 p-5">
                  <h4 className="text-lg font-extrabold text-blue-800">
                    Document Vault
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Upload and store customs preparation documents.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-5">
                  <h4 className="text-lg font-extrabold text-emerald-800">
                    Customers
                  </h4>
                  <p className="mt-1 text-sm text-emerald-700">
                    Add and manage customer records in one workspace.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-5">
                  <h4 className="text-lg font-extrabold text-amber-800">
                    Tax Simulation
                  </h4>
                  <p className="mt-1 text-sm text-amber-700">
                    Estimate customs taxes before declaration submission.
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-5">
                  <h4 className="text-lg font-extrabold text-violet-800">
                    Declaration Builder for CTP
                  </h4>
                  <p className="mt-1 text-sm text-violet-700">
                    Prepare structured declarations ready for final submission.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-extrabold text-slate-900">
                Selected Transiter
              </h3>

              {loadingTransiter ? (
                <div className="mt-5 animate-pulse">
                  <div className="mb-3 h-6 w-1/2 rounded bg-slate-200" />
                  <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                </div>
              ) : selectedTransiter ? (
                <div className="mt-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {selectedTransiter.logoUrl ? (
                        <img
                          src={selectedTransiter.logoUrl}
                          alt={selectedTransiter.name || "Transiter logo"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🏢</span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900">
                        {selectedTransiter.name ||
                          selectedTransiter.slug ||
                          selectedTransiter.id}
                      </h4>
                      <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-400">
                        {selectedTransiter.slug || selectedTransiter.id}
                      </p>
                      <p className="mt-3 text-slate-600">
                        {selectedTransiter.description ||
                          "Reusable transiter workspace for customs preparation."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-600">
                  Enter a transiter ID or slug to preview the workspace target.
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  <span className="font-extrabold text-slate-800">Note:</span>{" "}
                  The same codebase is reused across all transiters. Branding,
                  logo, customers, and declarations change dynamically by
                  transiter.
                </p>
              </div>

              {transiterLabel ? (
                <div className="mt-6">
                  <Link
                    href="/transiter-hub"
                    className="text-sm font-extrabold text-blue-700 hover:text-blue-800"
                  >
                    Back to Transiter Hub
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}