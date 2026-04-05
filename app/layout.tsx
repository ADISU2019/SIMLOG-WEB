/**
 * SIMLOG-WEB
 * Version: v2.0.0
 * Date: 2026-02-17
 * File: app/layout.tsx
 * Purpose: Root layout with global auth + navbar
 */

import Navbar from "./components/Navbar";
import "./globals.css";
import { AuthProvider } from "./auth/AuthProvider";

// ✅ add this (make sure the file exists at: app/components/AppHeader.tsx)
import AppHeader from "./components/AppHeader";

export default function RootLayout({ children }: any) {
  return (
    <html>
      <body>
        <AuthProvider>
          {/* ✅ Global logo on top-left (all pages) */}
          <AppHeader />

          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}