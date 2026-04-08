"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { exportToExcel, exportToPdf } from "../../../../lib/exports";
import QRCode from "qrcode";

type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TripType = "ONE_WAY" | "ROUND_TRIP";
type PaymentMethod = "cash" | "bank" | "mobile" | "credit";
type PaymentStatus = "pending_cashier" | "paid" | "partial" | "rejected";

type TripRow = {
  id: string;
  tripCode?: string | null;
  driverLinkKey?: string | null;
  tripType?: TripType | string | null;
  status?: TripStatus | string | null;
  truckPlate?: string | null;
  driverName?: string | null;
  startCity?: string | null;
  destinationCity?: string | null;
  loadType?: string | null;
  agreedCost?: number | string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerTelegramChatId?: string | null;
  assignedAt?: string | null;
  updatedAt?: string | null;
  payment?: {
    method?: PaymentMethod | null;
    status?: PaymentStatus | null;
    expectedAmount?: number | string | null;
    paidAmount?: number | string | null;
    balance?: number | string | null;
    currency?: "ETB" | string | null;
    receiptNumber?: string | null;
    receiptUrl?: string | null;
    receiptPath?: string | null;
    referenceNumber?: string | null;
    acceptedBy?: string | null;
    acceptedAt?: string | null;
    note?: string | null;
  } | null;
};

type LookupTrip = {
  id?: string | null;
  tripCode?: string | null;
  status?: string | null;
  truckPlate?: string | null;
  driverName?: string | null;
  startCity?: string | null;
  destinationCity?: string | null;
  loadType?: string | null;
  agreedCost?: number | string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerTelegramChatId?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

function normalizeCode(input: string) {
  return String(input).trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeCompanyId(input: unknown) {
  return String(input ?? "").trim();
}

function isInvalidCompanyId(input: unknown) {
  const v = normalizeCompanyId(input);
  return !v;
}

function money(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
}

function fmtIso(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function safeId(v: unknown) {
  return String(v ?? "").trim();
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

function pillStyle(bg: string, border: string) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 1000,
    letterSpacing: 0.25,
    border,
    background: bg,
    whiteSpace: "nowrap" as const,
  };
}

function statusPill(status: string) {
  const s = String(status ?? "ASSIGNED").toUpperCase();

  if (s === "COMPLETED") {
    return pillStyle(
      "rgba(107,114,128,0.16)",
      "1px solid rgba(0,0,0,0.10)"
    );
  }

  if (s === "IN_PROGRESS") {
    return pillStyle(
      "rgba(16,185,129,0.14)",
      "1px solid rgba(0,0,0,0.10)"
    );
  }

  if (s === "STARTED") {
    return pillStyle(
      "rgba(37,99,235,0.14)",
      "1px solid rgba(0,0,0,0.10)"
    );
  }

  if (s === "CANCELLED") {
    return pillStyle(
      "rgba(100,116,139,0.14)",
      "1px solid rgba(0,0,0,0.10)"
    );
  }

  return pillStyle("rgba(245,158,11,0.16)", "1px solid rgba(0,0,0,0.10)");
}

function paymentStatusPill(status?: string | null) {
  const s = String(status ?? "pending_cashier").toLowerCase();

  if (s === "paid") {
    return pillStyle(
      "rgba(16,185,129,0.14)",
      "1px solid rgba(16,185,129,0.28)"
    );
  }

  if (s === "partial") {
    return pillStyle(
      "rgba(245,158,11,0.14)",
      "1px solid rgba(245,158,11,0.28)"
    );
  }

  if (s === "rejected") {
    return pillStyle(
      "rgba(239,68,68,0.14)",
      "1px solid rgba(239,68,68,0.28)"
    );
  }

  return pillStyle(
    "rgba(59,130,246,0.12)",
    "1px solid rgba(59,130,246,0.24)"
  );
}

function paymentStatusLabel(status?: string | null) {
  const s = String(status ?? "pending_cashier").toLowerCase();
  if (s === "pending_cashier") return "Pending Cashier";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paymentMethodLabel(method?: string | null) {
  const m = String(method ?? "cash").toLowerCase();
  if (m === "mobile") return "Mobile";
  if (m === "credit") return "Credit";
  if (m === "bank") return "Bank";
  return "Cash";
}

function tripTypeLabel(tt?: string | null) {
  const t = String(tt ?? "ONE_WAY").toUpperCase();
  if (t === "ROUND_TRIP") return "Round Trip";
  return "One way";
}

function rowBgByTripType(tt?: string | null, idx = 0) {
  const t = String(tt ?? "ONE_WAY").toUpperCase();

  if (t === "ONE_WAY") {
    return idx % 2 === 0
      ? "rgba(186, 230, 253, 0.35)"
      : "rgba(186, 230, 253, 0.22)";
  }

  if (t === "ROUND_TRIP") {
    return idx % 2 === 0
      ? "rgba(220, 252, 231, 0.45)"
      : "rgba(220, 252, 231, 0.28)";
  }

  return idx % 2 === 0
    ? "rgba(251, 207, 232, 0.35)"
    : "rgba(251, 207, 232, 0.22)";
}

async function sendTelegram({
  chatId,
  ownerName,
  driverName,
  truckPlate,
  tripCode,
  startCity,
  destinationCity,
  status,
}: {
  chatId: string;
  ownerName?: string;
  driverName: string;
  truckPlate: string;
  tripCode: string;
  startCity: string;
  destinationCity: string;
  status: string;
}) {
  const message = `📢 Truck Owner Notification

${ownerName ? `Owner: ${ownerName}\n` : ""}Driver: ${driverName}
Truck: ${truckPlate}
Trip Code: ${tripCode}
Route: ${startCity} → ${destinationCity}
Current Status: ${status}

Your truck trip has been verified by dispatcher.`;

  const res = await fetch("/api/send-telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      message,
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram send failed (${res.status})`);
  }

  return true;
}

async function fetchJsonWithTrackingFallback(
  companyId: string,
  pathAfterTracking: string,
  init?: RequestInit
) {
  const cid = normalizeCompanyId(companyId);

  if (isInvalidCompanyId(cid)) {
    throw new Error(`Invalid companyId: "${cid || "(empty)"}"`);
  }

  const urls = [
    `/api/portal/tracking/${cid}/tracking/${pathAfterTracking}`,
    `/api/portal/${cid}/tracking/${pathAfterTracking}`,
  ];

  let lastError = "Request failed";

  for (const url of urls) {
    try {
      console.log("Trying API URL:", url);

      const res = await fetch(url, {
        cache: "no-store",
        ...init,
      });

      const text = await res.text().catch(() => "");
      const data = text ? JSON.parse(text) : {};

      if (res.ok) return data;

      const message =
        (data as any)?.error ||
        (data as any)?.message ||
        text ||
        `Request failed (${res.status})`;

      lastError = message;

      if (res.status === 404) continue;

      throw new Error(message);
    } catch (err) {
      if (url === urls[urls.length - 1]) {
        throw err instanceof Error ? err : new Error(lastError);
      }
    }
  }

  throw new Error(lastError);
}

export default function TrackingTripsDashboardPage() {
  const params = useParams();
  const companyId = useMemo(
    () => normalizeCompanyId(params?.companyId),
    [params]
  );

  const base = useMemo(() => `/portal/tracking/${companyId}`, [companyId]);
  const hrefHub = useMemo(() => `/portal/tracking`, []);
  const hrefDriver = useMemo(() => `${base}/driver`, [base]);
  const hrefFuel = useMemo(() => `${base}/reports/fuel`, [base]);
  const hrefTripsReport = useMemo(() => `${base}/reports/trips`, [base]);
  const hrefCashier = useMemo(() => `${base}/tracking/cashier`, [base]);

  const [rows, setRows] = useState<TripRow[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [noticeTrips, setNoticeTrips] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [creating, setCreating] = useState(false);
  const [createNotice, setCreateNotice] = useState<string | null>(null);

  const [tripType, setTripType] = useState<TripType>("ONE_WAY");
  const [truckPlate, setTruckPlate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [startCity, setStartCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [loadType, setLoadType] = useState("");
  const [agreedCost, setAgreedCost] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerTelegramChatId, setOwnerTelegramChatId] = useState("");

  const [newCodeBanner, setNewCodeBanner] = useState<null | {
    code: string;
    tripId: string;
    driverLinkKey?: string;
  }>(null);

  const [lookupCode, setLookupCode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupNotice, setLookupNotice] = useState<string | null>(null);
  const [lookupTrip, setLookupTrip] = useState<LookupTrip | null>(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);

  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const selectedCount = selectedIds.length;

  const allChecked = useMemo(
    () => rows.length > 0 && selectedCount === rows.length,
    [rows.length, selectedCount]
  );

  const canCreate =
    truckPlate.trim().length >= 2 &&
    driverName.trim().length >= 2 &&
    startCity.trim().length >= 2 &&
    destinationCity.trim().length >= 2;

  const lookupNormalized = useMemo(
    () => normalizeCode(lookupCode),
    [lookupCode]
  );
  const canLookup = lookupNormalized.length >= 4;

  const assignedTrips = useMemo(() => {
    return rows.filter(
      (r) => String(r.status ?? "").toUpperCase() === "ASSIGNED"
    );
  }, [rows]);

  const boardTrips = useMemo(() => assignedTrips.slice(0, 4), [assignedTrips]);

  const canSendTelegram =
    !!lookupTrip &&
    !!lookupTrip.ownerTelegramChatId &&
    String(lookupTrip.status ?? "").toUpperCase() === "STARTED";

  const paidTripsCount = useMemo(
    () =>
      rows.filter(
        (r) => String(r.payment?.status ?? "").toLowerCase() === "paid"
      ).length,
    [rows]
  );

  const partialTripsCount = useMemo(
    () =>
      rows.filter(
        (r) => String(r.payment?.status ?? "").toLowerCase() === "partial"
      ).length,
    [rows]
  );

  const pendingCashierTripsCount = useMemo(
    () =>
      rows.filter((r) => {
        const s = String(r.payment?.status ?? "pending_cashier").toLowerCase();
        return s === "pending_cashier" || !r.payment?.status;
      }).length,
    [rows]
  );

  async function loadTrips() {
    if (isInvalidCompanyId(companyId)) {
      setRows([]);
      setNoticeTrips(
        `Invalid companyId received: "${companyId || "(empty)"}". Open a real workspace.`
      );
      return;
    }

    setNoticeTrips(null);
    setLoadingTrips(true);

    try {
      const data = await fetchJsonWithTrackingFallback(
        companyId,
        "trips/list?limit=50"
      );

      const list = Array.isArray((data as { trips?: unknown[] })?.trips)
        ? ((data as { trips?: unknown[] }).trips as unknown[])
        : Array.isArray(data)
          ? data
          : [];

      const mapped: TripRow[] = list
        .map((t: any) => {
          const id = safeId(t?.id ?? t?.tripId ?? t?.docId ?? "");
          if (!id) return null;

          return {
            id,
            tripCode: t?.tripCode ?? t?.code ?? null,
            driverLinkKey:
              t?.driverLinkKey ?? t?.driverKey ?? t?.linkKey ?? null,
            tripType: t?.tripType ?? t?.type ?? null,
            status: t?.status ?? "ASSIGNED",
            truckPlate: t?.truckPlate ?? null,
            driverName: t?.driverName ?? null,
            startCity: t?.startCity ?? null,
            destinationCity: t?.destinationCity ?? null,
            loadType: t?.loadType ?? null,
            agreedCost: t?.agreedCost ?? null,
            ownerName: t?.ownerName ?? null,
            ownerPhone: t?.ownerPhone ?? null,
            ownerTelegramChatId:
              t?.ownerTelegramChatId ??
              t?.truckOwnerTelegramChatId ??
              t?.ownerChatId ??
              null,
            assignedAt: t?.assignedAt ?? null,
            updatedAt: t?.updatedAt ?? null,
            payment: t?.payment
              ? {
                  method: t.payment?.method ?? null,
                  status: t.payment?.status ?? null,
                  expectedAmount: t.payment?.expectedAmount ?? null,
                  paidAmount: t.payment?.paidAmount ?? t.payment?.amount ?? null,
                  balance: t.payment?.balance ?? null,
                  currency: t.payment?.currency ?? "ETB",
                  receiptNumber: t.payment?.receiptNumber ?? null,
                  receiptUrl: t.payment?.receiptUrl ?? null,
                  receiptPath: t.payment?.receiptPath ?? null,
                  referenceNumber: t.payment?.referenceNumber ?? null,
                  acceptedBy: t.payment?.acceptedBy ?? null,
                  acceptedAt: t.payment?.acceptedAt ?? null,
                  note: t.payment?.note ?? null,
                }
              : null,
          } as TripRow;
        })
        .filter(Boolean) as TripRow[];

      setRows(mapped);
    } catch (e: unknown) {
      setNoticeTrips(e instanceof Error ? e.message : "Failed to load trips");
      setRows([]);
    } finally {
      setLoadingTrips(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, [companyId]);

  useEffect(() => {
    async function buildQrs() {
      if (isInvalidCompanyId(companyId)) return;
      if (typeof window === "undefined") return;

      const next: Record<string, string> = {};

      for (const r of boardTrips) {
        const key = String(r.driverLinkKey ?? "").trim();
        const code = r.tripCode ? normalizeCode(r.tripCode) : "";

        if (!key && !code) continue;

        const url = key
          ? `${window.location.origin}/portal/tracking/${companyId}/driver?k=${encodeURIComponent(
              key
            )}`
          : `${window.location.origin}/portal/tracking/${companyId}/driver?code=${encodeURIComponent(
              code
            )}`;

        try {
          const qr = await QRCode.toDataURL(url, {
            width: 120,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          next[r.id] = qr;
        } catch {
          // ignore QR build failure
        }
      }

      setQrMap(next);
    }

    buildQrs();
  }, [boardTrips, companyId]);

  function toggleAll(v: boolean) {
    const next: Record<string, boolean> = {};
    if (v) rows.forEach((r) => (next[r.id] = true));
    setSelected(next);
  }

  async function createTrip() {
    if (isInvalidCompanyId(companyId)) {
      setCreateNotice("Invalid companyId. Open a real workspace first.");
      return;
    }

    setCreateNotice(null);
    setNewCodeBanner(null);

    if (!canCreate) {
      setCreateNotice(
        "Please fill Truck Plate, Driver Name, Start City, and Destination City."
      );
      return;
    }

    setCreating(true);

    try {
      const payload: Record<string, unknown> = {
        tripType,
        truckPlate: truckPlate.trim(),
        driverName: driverName.trim(),
        startCity: startCity.trim(),
        destinationCity: destinationCity.trim(),
        loadType: loadType.trim() || null,
        agreedCost: agreedCost.trim() ? Number(agreedCost.trim()) : null,
        ownerName: ownerName.trim() || null,
        ownerPhone: ownerPhone.trim() || null,
        ownerTelegramChatId: ownerTelegramChatId.trim() || null,
      };

      const data = await fetchJsonWithTrackingFallback(
        companyId,
        "trips/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const tripId = safeId(
        (data as any)?.tripId ??
          (data as any)?.id ??
          (data as any)?.trip?.id ??
          (data as any)?.trip?.tripId ??
          ""
      );

      const code = normalizeCode(
        (data as any)?.tripCode ??
          (data as any)?.code ??
          (data as any)?.trip?.tripCode ??
          (data as any)?.trip?.code ??
          ""
      );

      const driverLinkKey = safeId(
        (data as any)?.driverLinkKey ??
          (data as any)?.driverKey ??
          (data as any)?.trip?.driverLinkKey ??
          ""
      );

      if (tripId) {
        setNewCodeBanner({
          code,
          tripId,
          driverLinkKey: driverLinkKey || undefined,
        });
      }

      setTruckPlate("");
      setDriverName("");
      setStartCity("");
      setDestinationCity("");
      setLoadType("");
      setAgreedCost("");
      setOwnerName("");
      setOwnerPhone("");
      setOwnerTelegramChatId("");

      await loadTrips();
    } catch (e: unknown) {
      setCreateNotice(e instanceof Error ? e.message : "Failed to create trip");
    } finally {
      setCreating(false);
    }
  }

  async function doLookup() {
    if (isInvalidCompanyId(companyId)) {
      setLookupNotice("Invalid companyId. Open a real workspace first.");
      return;
    }

    setLookupNotice(null);
    setLookupTrip(null);

    const code = normalizeCode(lookupCode);

    if (!code) {
      setLookupNotice("Enter a Trip Code.");
      return;
    }

    setLookupLoading(true);

    try {
      const data = await fetchJsonWithTrackingFallback(
        companyId,
        "trips/by-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      const t = ((data as any)?.trip ?? data) as any;

      setLookupTrip({
        id: t?.tripId ?? t?.id ?? null,
        tripCode: code,
        status: t?.status ?? "ASSIGNED",
        truckPlate: t?.truckPlate ?? "-",
        driverName: t?.driverName ?? "-",
        startCity: t?.startCity ?? "-",
        destinationCity: t?.destinationCity ?? "-",
        loadType: t?.loadType ?? "-",
        agreedCost: t?.agreedCost ?? null,
        ownerName: t?.ownerName ?? "-",
        ownerPhone: t?.ownerPhone ?? "-",
        ownerTelegramChatId:
          t?.ownerTelegramChatId ??
          t?.truckOwnerTelegramChatId ??
          t?.ownerChatId ??
          "",
        assignedAt: t?.assignedAt ?? null,
        startedAt: t?.startedAt ?? null,
        completedAt: t?.completedAt ?? null,
      });
    } catch (e: unknown) {
      setLookupNotice(e instanceof Error ? e.message : "Failed to lookup trip");
    } finally {
      setLookupLoading(false);
    }
  }

  async function notifyOwnerByTelegram() {
    if (!lookupTrip) {
      setLookupNotice("Find a trip first.");
      return;
    }

    if (!lookupTrip.ownerTelegramChatId) {
      setLookupNotice("Owner Telegram Chat ID is missing for this trip.");
      return;
    }

    setSendingTelegram(true);

    try {
      await sendTelegram({
        chatId: lookupTrip.ownerTelegramChatId,
        ownerName: lookupTrip.ownerName ?? undefined,
        driverName: lookupTrip.driverName ?? "-",
        truckPlate: lookupTrip.truckPlate ?? "-",
        tripCode: lookupTrip.tripCode || lookupNormalized,
        startCity: lookupTrip.startCity ?? "-",
        destinationCity: lookupTrip.destinationCity ?? "-",
        status: lookupTrip.status ?? "ASSIGNED",
      });

      setLookupNotice("✅ Telegram notification sent to owner.");
    } catch (e: any) {
      setLookupNotice(e?.message ?? "Failed to send Telegram notification.");
    } finally {
      setSendingTelegram(false);
    }
  }

  function goFuelReportSelected() {
    if (!companyId || selectedIds.length === 0) return;
    const qs = new URLSearchParams({ tripIds: selectedIds.join(",") });
    window.location.href = `${hrefFuel}?${qs.toString()}`;
  }

  function goTripsReportSelected() {
    if (!companyId || selectedIds.length === 0) return;
    const qs = new URLSearchParams({ tripIds: selectedIds.join(",") });
    window.location.href = `${hrefTripsReport}?${qs.toString()}`;
  }

  function exportSelected(kind: "excel" | "pdf") {
    const sel = rows.filter((r) => r?.id && selectedIds.includes(r.id));
    if (sel.length === 0) return;

    const title = `Trips Export - ${companyId}`;
    const meta = [
      `Company: ${companyId}`,
      `Rows: ${sel.length}`,
      `Exported: ${new Date().toLocaleString()}`,
    ];

    const columns = [
      { key: "tripType", header: "TripType" },
      { key: "status", header: "Status" },
      { key: "paymentStatus", header: "Payment Status" },
      { key: "paymentMethod", header: "Payment Method" },
      { key: "paidAmount", header: "Paid Amount" },
      { key: "balance", header: "Balance" },
      { key: "dateTime", header: "Date/Time" },
      { key: "agreedCost", header: "Agreed Cost" },
      { key: "truckPlate", header: "Truck" },
      { key: "driverName", header: "Driver" },
      { key: "startCity", header: "Start City" },
      { key: "destinationCity", header: "Destination City" },
      { key: "id", header: "Trip ID" },
      { key: "tripCode", header: "Trip Code" },
      { key: "ownerName", header: "Owner Name" },
      { key: "ownerPhone", header: "Owner Phone" },
      { key: "ownerTelegramChatId", header: "Owner Telegram Chat ID" },
      { key: "receiptNumber", header: "Receipt Number" },
    ];

    const outRows = sel.map((r) => ({
      tripType: tripTypeLabel(r.tripType ?? null),
      status: String(r.status ?? "ASSIGNED"),
      paymentStatus: paymentStatusLabel(r.payment?.status),
      paymentMethod: paymentMethodLabel(r.payment?.method),
      paidAmount: money(r.payment?.paidAmount),
      balance: money(r.payment?.balance),
      dateTime: fmtIso(r.updatedAt ?? r.assignedAt ?? null),
      agreedCost: money(r.agreedCost),
      truckPlate: r.truckPlate ?? "-",
      driverName: r.driverName ?? "-",
      startCity: r.startCity ?? "-",
      destinationCity: r.destinationCity ?? "-",
      id: r.id,
      tripCode: r.tripCode ?? "-",
      ownerName: r.ownerName ?? "-",
      ownerPhone: r.ownerPhone ?? "-",
      ownerTelegramChatId: r.ownerTelegramChatId ?? "-",
      receiptNumber: r.payment?.receiptNumber ?? "-",
    }));

    if (kind === "excel") {
      exportToExcel({ title, meta, columns, rows: outRows });
    } else {
      exportToPdf({ title, meta, columns, rows: outRows });
    }
  }

  if (isInvalidCompanyId(companyId)) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 26, fontWeight: 1000 }}>Invalid companyId</div>
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            This page received:
            <b> {companyId || "(empty)"} </b>
            instead of a real workspace ID.
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/portal/tracking" style={{ fontWeight: 950 }}>
              ← Back to Tracking Home
            </Link>
          </div>
        </div>
      </main>
    );
  }
    return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 35%, #f8fafc 100%)",
      }}
    >
      <section style={{ padding: "42px 18px 18px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 30,
              padding: 28,
              border: "1px solid rgba(0,0,0,0.08)",
              background:
                "linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #7c3aed 100%)",
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
                }}
              >
                <div style={{ display: "grid", gap: 10, maxWidth: 820 }}>
                  <span
                    style={{
                      width: "fit-content",
                      minHeight: 44,
                      padding: "0 16px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      fontSize: 12,
                      fontWeight: 950,
                      letterSpacing: 0.35,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    TRACKING · DISPATCHER
                  </span>

                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 1000,
                      letterSpacing: 0.2,
                      lineHeight: 1.05,
                    }}
                  >
                    Trips Dashboard
                  </div>

                  <div style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6 }}>
                    Create trips · Select trips · Export · Run reports.
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
                        background: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(255,255,255,0.24)",
                        color: "#0f172a",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      ← Main Homepage
                    </Link>

                    <Link
                      href={hrefHub}
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(17,24,39,0.85)",
                        border: "1px solid rgba(255,255,255,0.16)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      ← Tracking Home
                    </Link>

                    <Link
                      href={hrefDriver}
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background:
                          "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      Driver Access →
                    </Link>

                    <Link
                      href={hrefCashier}
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background:
                          "linear-gradient(135deg, #10b981 0%, #0891b2 100%)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      Cashier →
                    </Link>

                    <Link
                      href={hrefFuel}
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      Fuel Report →
                    </Link>

                    <Link
                      href={hrefTripsReport}
                      style={{
                        textDecoration: "none",
                        padding: "12px 14px",
                        borderRadius: 16,
                        background:
                          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "white",
                        fontWeight: 950,
                        fontSize: 14,
                      }}
                    >
                      Trips Report →
                    </Link>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, minWidth: 280 }}>
                  <MiniStat label="Company ID" value={companyId} />
                  <MiniStat label="Trips" value={String(rows.length)} />
                  <MiniStat label="Paid Trips" value={String(paidTripsCount)} />
                  <MiniStat
                    label="Pending / Partial"
                    value={String(pendingCashierTripsCount + partialTripsCount)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {newCodeBanner?.tripId ? (
        <section style={{ padding: "0 18px 18px" }}>
          <div style={{ maxWidth: 1220, margin: "0 auto" }}>
            <div
              style={{
                borderRadius: 22,
                padding: 18,
                border: "1px solid rgba(16,185,129,0.35)",
                background:
                  "linear-gradient(90deg, rgba(16,185,129,0.10), rgba(59,130,246,0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 950, opacity: 0.8 }}>
                  Trip Created (share with driver)
                </div>

                {newCodeBanner.code ? (
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 1000,
                      letterSpacing: 1.5,
                    }}
                  >
                    Code: {newCodeBanner.code}
                  </div>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 950, opacity: 0.85 }}>
                    Code not shown here (secure mode). Use QR below.
                  </div>
                )}

                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Trip ID:{" "}
                  <code style={{ fontWeight: 900 }}>{newCodeBanner.tripId}</code>
                </div>

                {newCodeBanner.driverLinkKey ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    Driver Link Key:{" "}
                    <code style={{ fontWeight: 900 }}>
                      {newCodeBanner.driverLinkKey}
                    </code>
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setNewCodeBanner(null)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "white",
                    color: "#0f172a",
                    fontSize: 14,
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ padding: "0 18px 18px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 26, fontWeight: 1000, color: "#0f172a" }}
                >
                  Create Trip
                </div>
                <div
                  style={{
                    marginTop: 6,
                    opacity: 0.85,
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Creates <code>companies/{companyId}/trips</code> and generates a
                  driver access key for QR.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(16,185,129,0.35)",
                    background: "rgba(16,185,129,0.08)",
                    fontSize: 12,
                    fontWeight: 950,
                  }}
                >
                  QR-ready
                </span>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(148,163,184,0.12)",
                    fontSize: 12,
                    fontWeight: 950,
                  }}
                >
                  Secure (code hash)
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Trip Type *
                </div>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                    background: "white",
                  }}
                >
                  <option value="ONE_WAY">One way</option>
                  <option value="ROUND_TRIP">
                    Round Trip (returns to Start City)
                  </option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Truck Plate *
                </div>
                <input
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  placeholder="AB-12345"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Driver Name *
                </div>
                <input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver Full Name"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Start City *
                </div>
                <input
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                  placeholder="Addis Ababa"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Destination City *
                </div>
                <input
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="Adama"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Load Type
                </div>
                <input
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  placeholder="Maize / Fertilizer / ..."
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Agreed Cost
                </div>
                <input
                  value={agreedCost}
                  onChange={(e) => setAgreedCost(e.target.value)}
                  placeholder="150000"
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Owner Name
                </div>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Truck Owner Name"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Owner Phone
                </div>
                <input
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+251..."
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 950, marginBottom: 6 }}>
                  Owner Telegram Chat ID
                </div>
                <input
                  value={ownerTelegramChatId}
                  onChange={(e) => setOwnerTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={createTrip}
                disabled={creating || !canCreate}
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: creating
                    ? "rgba(148,163,184,0.35)"
                    : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  color: creating ? "#0f172a" : "white",
                  fontSize: 14,
                  fontWeight: 1000,
                  cursor: creating ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 28px rgba(37,99,235,0.18)",
                }}
              >
                {creating ? "Creating…" : "+ Create Trip"}
              </button>

              <button
                onClick={() => {
                  setCreateNotice(null);
                  setNewCodeBanner(null);
                  setTruckPlate("");
                  setDriverName("");
                  setStartCity("");
                  setDestinationCity("");
                  setLoadType("");
                  setAgreedCost("");
                  setOwnerName("");
                  setOwnerPhone("");
                  setOwnerTelegramChatId("");
                }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "white",
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 1000,
                  cursor: "pointer",
                  boxShadow: "0 14px 28px rgba(0,0,0,0.06)",
                }}
              >
                Reset
              </button>
            </div>

            {createNotice ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(245,158,11,0.28)",
                  background: "rgba(245,158,11,0.10)",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                Notice: {createNotice}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 18px 18px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 1000, color: "#0f172a" }}>
              Dynamic QR Dispatch Board
            </div>
            <div
              style={{
                marginTop: 6,
                opacity: 0.82,
                fontSize: 14,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Shows ONLY <b>ASSIGNED</b> trips (QR disappears after start). Max 4
              shown.
            </div>

            {boardTrips.length === 0 ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "rgba(148,163,184,0.10)",
                  fontWeight: 950,
                  opacity: 0.9,
                }}
              >
                No ASSIGNED trips right now. Create a trip to generate a QR.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 14,
                }}
              >
                {boardTrips.map((r) => {
                  const qr = qrMap[r.id];
                  const hasKey = !!String(r.driverLinkKey ?? "").trim();
                  const hasCode = !!String(r.tripCode ?? "").trim();

                  return (
                    <div
                      key={r.id}
                      style={{
                        borderRadius: 22,
                        border: "1px solid rgba(0,0,0,0.08)",
                        padding: 14,
                        background:
                          "linear-gradient(180deg, rgba(241,245,249,0.55), rgba(255,255,255,1))",
                        boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
                        display: "grid",
                        gap: 8,
                        alignContent: "start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 1000,
                          color: "#0f172a",
                        }}
                      >
                        {r.startCity ?? "-"} → {r.destinationCity ?? "-"}
                      </div>

                      <div
                        style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}
                      >
                        Truck: {r.truckPlate ?? "-"} · Driver: {r.driverName ?? "-"}
                      </div>

                      {(r.ownerName || r.ownerPhone || r.ownerTelegramChatId) && (
                        <div
                          style={{ fontSize: 12, opacity: 0.78, fontWeight: 900 }}
                        >
                          Owner: {r.ownerName ?? "-"} · Phone:{" "}
                          {r.ownerPhone ?? "-"} · Telegram:{" "}
                          {r.ownerTelegramChatId ? "Yes" : "No"}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={statusPill(String(r.status ?? "ASSIGNED"))}>
                          {String(r.status ?? "ASSIGNED")}
                        </span>

                        <div
                          style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}
                        >
                          {hasKey ? "QR via key" : hasCode ? "QR via code" : "No key"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        {qr ? (
                          <img
                            src={qr}
                            alt="Trip QR"
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 14,
                              border: "1px solid rgba(0,0,0,0.08)",
                              background: "white",
                              padding: 6,
                              flex: "0 0 auto",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 14,
                              border: "1px dashed rgba(0,0,0,0.18)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              opacity: 0.7,
                              flex: "0 0 auto",
                            }}
                          >
                            No QR
                          </div>
                        )}

                        <div style={{ display: "grid", gap: 8, width: "100%" }}>
                          <button
                            onClick={async () => {
                              const key = String(r.driverLinkKey ?? "").trim();
                              if (!key) return;

                              try {
                                await navigator.clipboard.writeText(key);
                                alert("Driver key copied");
                              } catch {
                                alert("Copy failed");
                              }
                            }}
                            disabled={!hasKey}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 14,
                              border: "1px solid rgba(0,0,0,0.10)",
                              background: hasKey
                                ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                                : "rgba(148,163,184,0.25)",
                              color: hasKey ? "white" : "#0f172a",
                              fontWeight: 1000,
                              cursor: hasKey ? "pointer" : "not-allowed",
                              width: "fit-content",
                            }}
                          >
                            Copy Key
                          </button>

                          <button
                            onClick={async () => {
                              if (typeof window === "undefined") return;

                              const key = String(r.driverLinkKey ?? "").trim();
                              if (!key) return;

                              const url = `${window.location.origin}/portal/tracking/${companyId}/driver?k=${encodeURIComponent(
                                key
                              )}`;

                              try {
                                await navigator.clipboard.writeText(url);
                                alert("Driver link copied");
                              } catch {
                                alert("Copy failed");
                              }
                            }}
                            disabled={!hasKey}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 14,
                              border: "1px solid rgba(0,0,0,0.10)",
                              background: hasKey
                                ? "linear-gradient(135deg, #22c55e 0%, #10b981 100%)"
                                : "rgba(148,163,184,0.25)",
                              color: hasKey ? "white" : "#0f172a",
                              fontWeight: 1000,
                              cursor: hasKey ? "pointer" : "not-allowed",
                              width: "fit-content",
                            }}
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                      {!hasKey && !hasCode ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            opacity: 0.75,
                            fontWeight: 900,
                          }}
                        >
                          ⚠️ No <code>driverLinkKey</code> found on this trip.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
              Tip: Show this on a dispatcher screen. Driver scans QR and opens
              their trip page.
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 18px 18px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 26, fontWeight: 1000, color: "#0f172a" }}
                >
                  Trips
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    opacity: 0.8,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Showing latest 50 trips (sorted by updatedAt).
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={loadTrips}
                  disabled={loadingTrips}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "white",
                    fontSize: 14,
                    fontWeight: 950,
                    cursor: loadingTrips ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingTrips ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  onClick={goFuelReportSelected}
                  disabled={selectedCount === 0}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(245,158,11,0.35)",
                    background:
                      selectedCount === 0
                        ? "rgba(148,163,184,0.18)"
                        : "rgba(245,158,11,0.12)",
                    fontSize: 14,
                    fontWeight: 1000,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Run Fuel Report (selected)
                </button>

                <button
                  onClick={goTripsReportSelected}
                  disabled={selectedCount === 0}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(99,102,241,0.35)",
                    background:
                      selectedCount === 0
                        ? "rgba(148,163,184,0.18)"
                        : "rgba(99,102,241,0.12)",
                    fontSize: 14,
                    fontWeight: 1000,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Run Trips Report (selected)
                </button>

                <span
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(99,102,241,0.35)",
                    background: "rgba(99,102,241,0.08)",
                    fontSize: 14,
                    fontWeight: 1000,
                  }}
                >
                  Selected: {selectedCount}
                </span>

                <button
                  onClick={() => exportSelected("excel")}
                  disabled={selectedCount === 0}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(16,185,129,0.35)",
                    background:
                      selectedCount === 0
                        ? "rgba(148,163,184,0.18)"
                        : "rgba(16,185,129,0.10)",
                    fontSize: 14,
                    fontWeight: 1000,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Export Excel ({selectedCount})
                </button>

                <button
                  onClick={() => exportSelected("pdf")}
                  disabled={selectedCount === 0}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(245,158,11,0.35)",
                    background:
                      selectedCount === 0
                        ? "rgba(148,163,184,0.18)"
                        : "rgba(245,158,11,0.10)",
                    fontSize: 14,
                    fontWeight: 1000,
                    cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Export PDF ({selectedCount})
                </button>
              </div>
            </div>

            {noticeTrips ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(245,158,11,0.28)",
                  background: "rgba(245,158,11,0.10)",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                Notice: {noticeTrips}
              </div>
            ) : null}

            <div style={{ marginTop: 14, overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 1480,
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(245, 158, 11, 0.28)" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                        aria-label="Select all"
                      />{" "}
                      Select
                    </th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>TripType</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Status</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Payment Status</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Payment Method</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Paid Amount</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Balance</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Receipt</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Date/Time</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Agreed Cost</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Truck</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Driver</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Start City</th>
                    <th style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>Destination City</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        style={{ padding: 16, fontWeight: 900, opacity: 0.8 }}
                      >
                        {loadingTrips
                          ? "Loading trips…"
                          : "No trips found yet. Create your first trip above."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => {
                      const bg = rowBgByTripType(r.tripType ?? null, idx);
                      const dt = fmtIso(r.updatedAt ?? r.assignedAt ?? null);

                      return (
                        <tr key={r.id} style={{ background: bg }}>
                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <input
                              type="checkbox"
                              checked={!!selected[r.id]}
                              onChange={(e) =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.checked,
                                }))
                              }
                              aria-label={`Select trip ${r.id}`}
                            />
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {tripTypeLabel(r.tripType ?? null)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={statusPill(String(r.status ?? "ASSIGNED"))}>
                              {String(r.status ?? "ASSIGNED")}
                            </span>
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={paymentStatusPill(r.payment?.status)}>
                              {paymentStatusLabel(r.payment?.status)}
                            </span>
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {paymentMethodLabel(r.payment?.method)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {money(r.payment?.paidAmount)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {money(r.payment?.balance)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {r.payment?.receiptUrl ? (
                              <a
                                href={r.payment.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#0f766e",
                                  fontWeight: 900,
                                  textDecoration: "none",
                                }}
                              >
                                View ↗
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 13 }}>
                            {dt}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {money(r.agreedCost)}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900 }}>
                            {r.truckPlate ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {r.driverName ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {r.startCity ?? "-"}
                          </td>

                          <td style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {r.destinationCity ?? "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
              Tip: Dispatcher can now monitor cashier progress directly from this
              table.
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 18px 44px" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 26,
              padding: 22,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 1000, color: "#0f172a" }}>
              Dispatcher Quick Check
            </div>
            <div
              style={{
                marginTop: 6,
                opacity: 0.82,
                fontSize: 14,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Lookup a trip by driver Trip Code, confirm it has started, then
              notify owner on Telegram.
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                placeholder="Trip Code (e.g. A05012)"
                style={{
                  padding: 16,
                  borderRadius: 18,
                  border: "1px solid #d1d5db",
                  fontSize: 22,
                  fontWeight: 1000,
                  letterSpacing: 1.4,
                  width: 360,
                }}
              />

              <button
                onClick={doLookup}
                disabled={!canLookup || lookupLoading}
                style={{
                  padding: "16px 18px",
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: lookupLoading
                    ? "rgba(148,163,184,0.35)"
                    : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  color: lookupLoading ? "#0f172a" : "white",
                  fontSize: 16,
                  fontWeight: 1000,
                  cursor:
                    !canLookup || lookupLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 28px rgba(37,99,235,0.20)",
                }}
              >
                {lookupLoading ? "Searching…" : "Find Trip"}
              </button>

              <button
                onClick={() => {
                  setLookupCode("");
                  setLookupTrip(null);
                  setLookupNotice(null);
                }}
                style={{
                  padding: "16px 18px",
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "white",
                  fontSize: 16,
                  fontWeight: 1000,
                  cursor: "pointer",
                  boxShadow: "0 14px 28px rgba(0,0,0,0.06)",
                }}
              >
                Reset
              </button>

              <button
                onClick={notifyOwnerByTelegram}
                disabled={!canSendTelegram || sendingTelegram}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 24px",
                  borderRadius: 999,
                  border: canSendTelegram
                    ? "1px solid rgba(234,88,12,0.28)"
                    : "1px solid rgba(251,146,60,0.22)",
                  background: sendingTelegram
                    ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
                    : canSendTelegram
                      ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      : "linear-gradient(135deg, rgba(255,237,213,0.95) 0%, rgba(254,215,170,0.95) 100%)",
                  color:
                    canSendTelegram || sendingTelegram ? "white" : "#9a3412",
                  fontSize: 16,
                  fontWeight: 1000,
                  letterSpacing: 0.2,
                  cursor:
                    !canSendTelegram || sendingTelegram
                      ? "not-allowed"
                      : "pointer",
                  boxShadow: sendingTelegram
                    ? "0 16px 34px rgba(249,115,22,0.34)"
                    : canSendTelegram
                      ? "0 16px 34px rgba(234,88,12,0.32)"
                      : "0 8px 18px rgba(249,115,22,0.14)",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                  opacity: sendingTelegram ? 0.96 : canSendTelegram ? 1 : 0.92,
                  minWidth: 300,
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!canSendTelegram || sendingTelegram) return;
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(234,88,12,0.40)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = canSendTelegram
                    ? "0 16px 34px rgba(234,88,12,0.32)"
                    : sendingTelegram
                      ? "0 16px 34px rgba(249,115,22,0.34)"
                      : "0 8px 18px rgba(249,115,22,0.14)";
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      canSendTelegram && !sendingTelegram
                        ? "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 35%, transparent 70%)"
                        : "none",
                    transform: "translateX(-120%)",
                    animation:
                      canSendTelegram && !sendingTelegram
                        ? "telegramShine 2.4s ease-in-out infinite"
                        : "none",
                    pointerEvents: "none",
                  }}
                />

                <span
                  style={{
                    width: 24,
                    height: 24,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    lineHeight: 1,
                    transform: sendingTelegram
                      ? "scale(1.08)"
                      : "translateY(-1px)",
                    animation: sendingTelegram
                      ? "telegramPulse 0.9s ease-in-out infinite"
                      : "none",
                    zIndex: 1,
                  }}
                >
                  {sendingTelegram ? "⏳" : canSendTelegram ? "🚀" : "✈️"}
                </span>

                <span style={{ zIndex: 1 }}>
                  {sendingTelegram
                    ? "Sending Telegram…"
                    : canSendTelegram
                      ? "Send Telegram to Owner"
                      : "Telegram Ready When Trip Starts"}
                </span>
              </button>
            </div>

            {!canSendTelegram && lookupTrip ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(249,115,22,0.28)",
                  background:
                    "linear-gradient(135deg, rgba(255,237,213,0.85), rgba(255,247,237,0.96))",
                  color: "#c2410c",
                  fontWeight: 1000,
                  fontSize: 13,
                  boxShadow: "0 8px 18px rgba(249,115,22,0.10)",
                }}
              >
                Telegram button becomes active only when trip status is{" "}
                <b>STARTED</b> and owner Telegram Chat ID exists.
              </div>
            ) : null}

            {lookupNotice ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(245,158,11,0.28)",
                  background: "rgba(245,158,11,0.10)",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                Notice: {lookupNotice}
              </div>
            ) : null}

            {lookupTrip ? (
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 1000,
                        color: "#0f172a",
                      }}
                    >
                      Trip Snapshot
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        opacity: 0.8,
                        fontWeight: 900,
                      }}
                    >
                      Trip ID:{" "}
                      <code style={{ fontWeight: 1000 }}>
                        {String(lookupTrip.id ?? "-")}
                      </code>
                    </div>
                  </div>

                  <span style={statusPill(String(lookupTrip.status ?? "ASSIGNED"))}>
                    {String(lookupTrip.status ?? "ASSIGNED")}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Truck
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 18, fontWeight: 1000 }}
                    >
                      {lookupTrip.truckPlate}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Driver
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 18, fontWeight: 1000 }}
                    >
                      {lookupTrip.driverName}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Route
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 18, fontWeight: 1000 }}
                    >
                      {lookupTrip.startCity} → {lookupTrip.destinationCity}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Agreed Cost
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 18, fontWeight: 1000 }}
                    >
                      {money(lookupTrip.agreedCost)}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Owner
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 16, fontWeight: 950 }}
                    >
                      {lookupTrip.ownerName}
                      <br />
                      {lookupTrip.ownerPhone}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Owner Telegram Chat ID
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 16, fontWeight: 950 }}
                    >
                      {lookupTrip.ownerTelegramChatId || "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Assigned At
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 16, fontWeight: 950 }}
                    >
                      {fmtIso(lookupTrip.assignedAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 1000 }}>
                      Started / Completed
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 14, fontWeight: 950 }}
                    >
                      Started: {fmtIso(lookupTrip.startedAt)}
                      <br />
                      Completed: {fmtIso(lookupTrip.completedAt)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={hrefDriver}
                    style={{
                      textDecoration: "none",
                      fontWeight: 1000,
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "white",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                      width: "fit-content",
                    }}
                  >
                    Open Driver Access →
                  </Link>

                  <Link
                    href={hrefCashier}
                    style={{
                      textDecoration: "none",
                      fontWeight: 1000,
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "white",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                      width: "fit-content",
                    }}
                  >
                    Open Cashier →
                  </Link>

                  <Link
                    href={hrefFuel}
                    style={{
                      textDecoration: "none",
                      fontWeight: 1000,
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "white",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                      width: "fit-content",
                    }}
                  >
                    Open Fuel Report →
                  </Link>

                  <Link
                    href={hrefTripsReport}
                    style={{
                      textDecoration: "none",
                      fontWeight: 1000,
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "white",
                      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
                      width: "fit-content",
                    }}
                  >
                    Open Trips Report →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes telegramPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.14);
            opacity: 0.88;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes telegramShine {
          0% {
            transform: translateX(-120%);
          }
          60% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </main>
  );
}