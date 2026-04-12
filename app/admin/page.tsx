"use client";

import { useEffect, useState } from "react";

type PendingApplication = {
  id: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  ownerUid?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const DEV_BYPASS_ADMIN_LOGIN = true;

function fmtDate(v?: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function loadRows() {
    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/admin/applications", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load applications.");
      }

      setRows(Array.isArray(data?.applications) ? data.applications : []);
    } catch (e: any) {
      setNotice(e?.message || "Failed to load applications.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (DEV_BYPASS_ADMIN_LOGIN) {
      loadRows();
    }
  }, []);

  async function updateApplication(id: string, action: "approve" | "reject") {
    setWorkingId(id);
    setNotice(null);

    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${action} application.`);
      }

      setNotice(
        action === "approve"
          ? "Application approved successfully."
          : "Application rejected successfully."
      );

      await loadRows();
    } catch (e: any) {
      setNotice(e?.message || `Failed to ${action} application.`);
    } finally {
      setWorkingId(null);
    }
  }

  if (!DEV_BYPASS_ADMIN_LOGIN) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Admin Login
          </h1>
          <p className="mt-3 text-slate-600">
            Later you can enable real admin login here for:
            <span className="ml-2 font-bold">
              admin@simarantechnolgies.com
            </span>
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Admin login is currently disabled because you are still developing.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 p-8 text-white shadow-2xl">
          <div className="text-sm font-extrabold uppercase tracking-[0.25em] text-white/80">
            Platform Admin
          </div>
          <h1 className="mt-3 text-4xl font-extrabold">
            Application Approval Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-white/85">
            Review and approve new subscriptions for both Transiter Hub and
            Tracking-related onboarding.
          </p>
        </div>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-800">
            {notice}
          </div>
        ) : null}

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Pending Applications
              </h2>
              <p className="mt-1 text-slate-600">
                New subscriptions waiting for review.
              </p>
            </div>

            <button
              onClick={loadRows}
              disabled={loading}
              className="rounded-full bg-slate-900 px-5 py-3 font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Slug / ID
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Created
                  </th>
                  <th className="px-4 py-3 text-sm font-extrabold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border-t px-4 py-6 font-semibold text-slate-600"
                    >
                      {loading
                        ? "Loading applications..."
                        : "No pending applications found."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="bg-white">
                      <td className="border-t px-4 py-4 font-bold text-slate-900">
                        {row.name || "-"}
                      </td>
                      <td className="border-t px-4 py-4 text-slate-700">
                        {row.slug || row.id}
                      </td>
                      <td className="border-t px-4 py-4 text-slate-700">
                        {row.email || "-"}
                      </td>
                      <td className="border-t px-4 py-4 text-slate-700">
                        {row.phone || "-"}
                      </td>
                      <td className="border-t px-4 py-4">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-800">
                          {row.approvalStatus || "pending"}
                        </span>
                      </td>
                      <td className="border-t px-4 py-4 text-slate-700">
                        {fmtDate(row.createdAt)}
                      </td>
                      <td className="border-t px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateApplication(row.id, "approve")}
                            disabled={workingId === row.id}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => updateApplication(row.id, "reject")}
                            disabled={workingId === row.id}
                            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">
            Development mode is active. Admin login is bypassed for now.
            Later, you can connect this same page to
            <span className="mx-1 font-bold">
              admin@simarantechnolgies.com
            </span>
            with Firebase Auth.
          </div>
        </div>
      </div>
    </main>
  );
}