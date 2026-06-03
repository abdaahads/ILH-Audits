/**
 * NEXT.JS ENTRY MIDDLEWARE — src/middleware.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the entry point for Next.js Edge Middleware. It intercepts
 * incoming HTTP requests and delegates them to our Supabase auth helper.
 *
 * WHY IT MATTERS FOR ILH:
 * The `try/catch` block provides Graceful Middleware Recovery.
 * If Supabase experiences an outage, or if the Vercel Edge Runtime
 * throws an unexpected networking error, this catches it and allows
 * the request to proceed (`NextResponse.next()`). The user will then
 * hit the application code which will handle the error gracefully
 * (e.g., showing a friendly "Database Offline" UI) rather than
 * crashing with a blank 500 error page.
 *
 * FOR DEVELOPERS:
 * - The `config.matcher` array uses a complex Regex.
 * - It explicitly IGNORES static files (`/_next/static`, images, fonts).
 * - Why? Running middleware on a 50KB image request wastes Vercel Edge
 *   compute units and slows down asset loading. The Regex ensures we
 *   only run auth checks on actual HTML pages and API routes.
 * ============================================================
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Graceful Middleware Recovery:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets served by Next.js:
     *  - _next/static  (compiled assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico   (browser favicon)
     *  - common image file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
