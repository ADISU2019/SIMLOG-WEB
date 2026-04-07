// app/register/page.tsx
// TRANSITER SUBSCRIPTION PAGE
// PURPOSE:
// This page allows a new transiter company to subscribe, create an account,
// and become available inside the Transiter Hub.
//
// WHAT THIS PAGE DOES:
// - creates a Firebase Auth user
// - checks whether the requested transiter slug already exists
// - creates a transiter company record in Firestore
// - creates a user profile linked to that transiter
// - cleans up auth user if Firestore write fails
// - shows the real Firebase/Firestore error on screen for debugging
// - redirects the new transiter to their dashboard
//
// ROUTE:
// /register

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getFriendlyErrorMessage(error: any) {
  const code = error?.code || "";
  const message = error?.message || "Registration failed. Please try again.";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase Authentication.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured correctly.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication.";
    case "permission-denied":
      return "Firestore permission denied. Please check Firestore security rules.";
    case "unavailable":
      return "Firebase service is temporarily unavailable. Please try again.";
    default:
      return code ? `${code}: ${message}` : message;
  }
}

export default function RegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const suggestedSlug = useMemo(() => slugify(companyName), [companyName]);
  const finalSlug = (companySlug.trim() || suggestedSlug).trim();

  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedCompanyName = companyName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedDescription = description.trim();
    const normalizedSlug = slugify(finalSlug);

    if (!normalizedCompanyName) {
      setError("Please enter your transiter company name.");
      return;
    }

    if (!normalizedSlug) {
      setError("Please enter a valid company slug.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    let createdAuthUser = null;

    try {
      setSubmitting(true);

      console.log("REGISTER STEP 1: checking slug", normalizedSlug);

      // 1. Check whether transiter slug already exists
      const transiterRef = doc(db, "transiters", normalizedSlug);
      const existingTransiter = await getDoc(transiterRef);

      if (existingTransiter.exists()) {
        setError("This workspace slug is already in use. Please choose another.");
        return;
      }

      console.log("REGISTER STEP 2: creating auth user", normalizedEmail);

      // 2. Create auth user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      createdAuthUser = userCred.user;
      const uid = userCred.user.uid;

      console.log("REGISTER STEP 3: creating transiter doc", normalizedSlug);

      // 3. Create transiter company document
      await setDoc(transiterRef, {
        name: normalizedCompanyName,
        slug: normalizedSlug,
        email: normalizedEmail,
        phone: normalizedPhone || "",
        description:
          normalizedDescription ||
          "Registered transiter workspace for customs preparation and declaration operations.",
        logoUrl: "",
        isActive: true,
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("REGISTER STEP 4: creating user profile", uid);

      // 4. Create user profile document
      await setDoc(doc(db, "users", uid), {
        email: normalizedEmail,
        role: "transiter_admin",
        transiterId: normalizedSlug,
        companyName: normalizedCompanyName,
        phone: normalizedPhone || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("REGISTER STEP 5: success");

      setSuccessMessage(
        "Subscription successful. Opening your transiter dashboard..."
      );

      router.push(`/portal/${normalizedSlug}/dashboard`);
    } catch (error: any) {
      console.error("REGISTER ERROR OBJECT:", error);
      console.error("REGISTER ERROR CODE:", error?.code);
      console.error("REGISTER ERROR MESSAGE:", error?.message);

      // Cleanup auth user if auth succeeded but Firestore failed
      if (createdAuthUser) {
        try {
          console.warn("REGISTER CLEANUP: deleting partially created auth user");
          await deleteUser(createdAuthUser);
          await signOut(auth);
        } catch (cleanupError: any) {
          console.error("REGISTER CLEANUP FAILED:", cleanupError);
        }
      }

      setError(getFriendlyErrorMessage(error));
    } finally {
      setSubmitting(false);
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
            Transiter Subscription
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight md:text-6xl">
            Create Your Transiter Account and Workspace
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/90 md:text-2xl">
            Subscribe as a new transiter company, create your login account,
            and open your own dashboard inside the platform.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                Subscribe
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Enter your company details to create a new transiter workspace.
              </p>
            </div>

            <form onSubmit={register} className="space-y-6">
              <div>
                <label
                  htmlFor="companyName"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Transiter Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="SIMARAN Logistics"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label
                  htmlFor="companySlug"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Workspace Slug
                </label>
                <input
                  id="companySlug"
                  type="text"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(slugify(e.target.value))}
                  placeholder={suggestedSlug || "simaran-logistics"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="mt-2 text-sm text-slate-500">
                  This becomes your workspace ID, for example:{" "}
                  <span className="font-extrabold text-slate-700">
                    {finalSlug || "simaran-logistics"}
                  </span>
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
                  htmlFor="phone"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
                >
                  Company Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of your transiter company..."
                  rows={4}
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating Workspace..." : "Create Transiter Account"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-slate-600">
                Already registered?{" "}
                <Link
                  href="/auth/login"
                  className="font-extrabold text-blue-700 hover:text-blue-800"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-extrabold text-slate-900">
                What You Get
              </h3>
              <p className="mt-3 text-slate-600">
                Your subscription creates a reusable company workspace inside
                the platform.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl bg-blue-50 p-5">
                  <h4 className="text-lg font-extrabold text-blue-800">
                    Company Dashboard
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Your own branded entry point for customs operations.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-5">
                  <h4 className="text-lg font-extrabold text-emerald-800">
                    Customer Management
                  </h4>
                  <p className="mt-1 text-sm text-emerald-700">
                    Add and manage importers, exporters, and customer records.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-5">
                  <h4 className="text-lg font-extrabold text-amber-800">
                    Tax Simulation
                  </h4>
                  <p className="mt-1 text-sm text-amber-700">
                    Estimate customs taxes before declaration preparation.
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-5">
                  <h4 className="text-lg font-extrabold text-violet-800">
                    Declaration Workflow
                  </h4>
                  <p className="mt-1 text-sm text-violet-700">
                    Prepare structured declaration files for CTP readiness.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-extrabold text-slate-900">
                Subscription Flow
              </h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Step 1
                  </p>
                  <p className="mt-2 text-slate-700">
                    Create your transiter account with company details, email,
                    and password.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Step 2
                  </p>
                  <p className="mt-2 text-slate-700">
                    Your transiter workspace is created inside the platform.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Step 3
                  </p>
                  <p className="mt-2 text-slate-700">
                    You are redirected to your own dashboard and can begin work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}