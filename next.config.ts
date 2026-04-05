/**
 * =========================================================
 * SIMLOG-WEB Next.js Configuration
 * ---------------------------------------------------------
 * Purpose:
 * 1. Enable clean SaaS-style URLs for companies
 * 2. Keep internal routing under /portal/tracking/[companyId]
 *
 * Example:
 *   Clean URL
 *     /inari/tracking
 *
 *   Internally rewrites to
 *     /portal/tracking/inari/tracking
 *
 * This keeps the architecture organized while giving
 * customers simple production URLs.
 * =========================================================
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Workspace
      {
        source: "/:companySlug",
        destination: "/portal/tracking/:companySlug",
      },

      // Trips Dashboard
      {
        source: "/:companySlug/tracking",
        destination: "/portal/tracking/:companySlug/tracking",
      },

      // Trips Report
      {
        source: "/:companySlug/reports/trips",
        destination: "/portal/tracking/:companySlug/reports/trips",
      },

      // Fuel Report
      {
        source: "/:companySlug/reports/fuel",
        destination: "/portal/tracking/:companySlug/reports/fuel",
      },

      // Drivers
      {
        source: "/:companySlug/drivers",
        destination: "/portal/tracking/:companySlug/driver",
      },
    ];
  },
};

export default nextConfig;