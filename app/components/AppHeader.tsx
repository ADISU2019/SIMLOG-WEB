// app/components/AppHeader.tsx
// GLOBAL APP HEADER LOGO
// PURPOSE:
// This component renders the floating SIMARAN Technologies logo used across the app.
//
// WHAT THIS COMPONENT DOES:
// - keeps the large SIMARAN logo visible
// - positions the logo higher and further left
// - helps prevent overlap with sidebar text in portal pages
//
// IMPORTANT:
// This keeps the logo visible as requested while reducing interference
// with workspace labels and sidebar content.

"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="absolute left-0 top-8 z-50">
      <Link href="/">
        <img
          src="/logo/simaran.png"
          alt="SIMARAN Technologies logo"
          className="h-44 w-44 object-cover md:h-56 md:w-56"
          draggable={false}
        />
      </Link>
    </header>
  );
}