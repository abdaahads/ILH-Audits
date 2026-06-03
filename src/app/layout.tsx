/**
 * ROOT LAYOUT — src/app/layout.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the top-level layout for the entire ILH Audits application.
 * In Next.js (App Router), every page is automatically wrapped by this
 * component. It sets up:
 *   1. The HTML document structure (<html>, <body>)
 *   2. Global fonts (Geist Sans for UI text, Geist Mono for code/numbers)
 *   3. SEO metadata (page title, description, favicon) so the app looks
 *      professional when shared on Google, Slack, WhatsApp, etc.
 *   4. Vercel Analytics to track real-time page views and user engagement
 *
 * WHY IT MATTERS FOR ILH:
 * This ensures every page across the platform — from the login screen
 * to the founder's analytics dashboard — has a consistent look, proper
 * branding metadata, and usage tracking. The analytics data helps the
 * founder understand how frequently auditors and ops managers use the
 * system, which pages are most visited, and where users drop off.
 *
 * FOR DEVELOPERS:
 * - This file runs on the SERVER (no "use client" directive).
 * - The `metadata` export is a Next.js convention for static SEO tags.
 * - The Geist font variables (--font-geist-sans, --font-geist-mono) are
 *   applied via CSS custom properties and consumed by Tailwind in globals.css.
 * - The `<Analytics />` component sends anonymous pageview events to Vercel's
 *   dashboard (https://vercel.com/analytics) — no PII is collected.
 * ============================================================
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

/* ── Font Configuration ──
 * Geist Sans: A clean, modern sans-serif font designed by Vercel.
 *   Used for all UI text (headings, labels, body copy).
 * Geist Mono: The monospaced variant.
 *   Used for numeric scores, dates, and code-like content (e.g., "82.5%").
 *
 * The `variable` option creates a CSS custom property (e.g., --font-geist-sans)
 * that can be referenced in Tailwind or raw CSS. The `subsets: ["latin"]`
 * ensures only Latin characters are loaded, keeping the font payload small
 * for fast page loads — especially important for auditors on mobile networks
 * at remote property sites. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ── SEO Metadata ──
 * This metadata is injected into the <head> of every page. It controls:
 *   - Browser tab title: "ILH Audits — Ivy League House EHS & Operations"
 *   - Google search snippet description
 *   - Social media link previews (WhatsApp, Slack, LinkedIn)
 *   - Favicon and Apple touch icon (uses the ILH brand icon)
 *
 * WHY "EHS & Operations":
 * EHS = Environment, Health & Safety — the core compliance framework
 * that ILH properties must adhere to under Indian regulations (Factories Act,
 * BOCWA, FSSAI). Including this in the title signals to stakeholders that
 * this is a professional compliance tool, not just a simple checklist app. */
export const metadata: Metadata = {
  title: "ILH Audits — Ivy League House EHS & Operations",
  description: "Comprehensive Environment, Health, Safety, and Business Operations Auditing Platform for Ivy League House.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

/**
 * RootLayout — Wraps every page in the application.
 *
 * The layout hierarchy in this app is:
 *   RootLayout (this file)
 *     └─ LoginPage (no nested layout — full-screen auth)
 *     └─ DashboardLayout (src/app/dashboard/layout.tsx — sidebar + nav)
 *         └─ DashboardPage (analytics overview)
 *         └─ AuditHistoryPage (list of past audits)
 *         └─ NewAuditPage (the multi-step audit wizard)
 *         └─ PropertiesPage (property portfolio grid)
 *         └─ IssuesPage (CAP board for operations)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Vercel Analytics — tracks anonymous page views and Web Vitals.
         * This helps the founder monitor platform adoption and performance.
         * No personal data is collected. Dashboard: https://vercel.com/analytics */}
        <Analytics />
      </body>
    </html>
  );
}
