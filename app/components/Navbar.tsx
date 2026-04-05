// app/components/AppHeader.tsx
// GLOBAL APP HEADER LOGO
// PURPOSE:
// Shows floating SIMARAN logo only on public pages.
//
// IMPORTANT:
// Hide logo on /portal pages to avoid overlap with portal layout content.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  // Hide floating logo inside portal pages
  if (pathname.startsWith("/portal")) {
    return null;
  }

  return (
    <header className="absolute left-0 top-6 z-50">
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