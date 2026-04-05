/**
 * SIMLOG-WEB
 * Brand Navigation Component
 * Version: v2.0.1
 * Date: 2026-02-17
 */

"use client";
import Link from "next/link";

export default function BrandNav() {
  return (
    <div className="w-full bg-white shadow-sm py-4">
      <div className="max-w-7xl mx-auto flex justify-center gap-6 text-lg font-semibold">

        <Link href="#history">
          <span className="px-6 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition cursor-pointer">
            Our History
          </span>
        </Link>

        <Link href="#who">
          <span className="px-6 py-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition cursor-pointer">
            Who We Are
          </span>
        </Link>

        <Link href="#what">
          <span className="px-6 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition cursor-pointer">
            What We Do
          </span>
        </Link>

        <Link href="#grow">
          <span className="px-6 py-2 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition cursor-pointer">
            Come Grow With Us
          </span>
        </Link>

      </div>
    </div>
  );
}