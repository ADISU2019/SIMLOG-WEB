"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Declaration = {
  id: string;
  customerName?: string;
  shipmentId?: string;
  status?: string;
  createdAt?: any;
};

type Props = {
  slug: string;
};

export default function DeclarationList({ slug }: Props) {
  const [rows, setRows] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const ref = collection(db, "transiters", slug, "declarations");

    // Safe: requires createdAt; if you don’t have it yet, remove orderBy
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            customerName: data.customerName || "",
            shipmentId: data.shipmentId || "",
            status: data.status || "DRAFT",
            createdAt: data.createdAt,
          };
        });

        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load declarations:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-gray-500">
        Loading declarations…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-gray-500">
        No declarations yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((d) => (
        <Link
          key={d.id}
          href={`/portal/${slug}/declarations/${d.id}`}
        >
          <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition cursor-pointer">
            <div>
              <div className="font-semibold text-blue-700">
                {d.customerName || "Unknown Customer"}
              </div>
              <div className="text-sm text-gray-500">
                Shipment: {d.shipmentId || "-"}
              </div>
            </div>

            <div className="text-sm font-semibold">
              {d.status}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}