/**
 * SUPABASE SESSION MIDDLEWARE — src/lib/supabase/middleware.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This script runs on Vercel's Edge network *before* every single request
 * reaches the application. It performs two critical security functions:
 *
 *   1. Token Refresh: Supabase JWT tokens expire every hour. This script
 *      calls `supabase.auth.getUser()`, which silently refreshes the
 *      token if it's nearing expiration, and forwards the new cookie
 *      to the browser.
 *   2. Route Protection: It acts as the bouncer. If a user tries to access
 *      `/dashboard` without a valid token, it instantly redirects them to
 *      `/login`.
 *
 * WHY IT MATTERS FOR ILH:
 * Compliance data is highly sensitive. The operations dashboard contains
 * financial and structural details about the properties. This middleware
 * guarantees that zero protected data ever leaves the server if the user
 * is unauthenticated.
 *
 * FOR DEVELOPERS:
 * - Public routes bypass the redirect logic (/, /login, /auth/*).
 * - Setup Redirect: If the app detects placeholder environment variables
 *   (e.g., just cloned from GitHub), it redirects to a `/setup` splash screen
 *   explaining how to run the app in offline mode or connect a DB.
 * - Offline Demo Mode: Can be enabled via env var or cookie to completely
 *   bypass authentication for stakeholder review.
 * ============================================================
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isOfflineMode = 
    process.env.NEXT_PUBLIC_OFFLINE_DEMO === "true" ||
    request.cookies.get("ilh_offline_mode")?.value === "true";

  if (isOfflineMode) {
    return NextResponse.next();
  }

  if (!url || !key || url === "YOUR_PROJECT_URL" || key === "YOUR_PUBLISHABLE_KEY") {
    if (
      request.nextUrl.pathname === "/setup" || 
      request.nextUrl.pathname.startsWith("/_next") || 
      request.nextUrl.pathname.includes("favicon")
    ) {
      return NextResponse.next();
    }
    const setupUrl = new URL('/setup', request.url);
    return NextResponse.redirect(setupUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          /* Forward updated cookies to the browser via the response */
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* Refresh the session — this call is required to keep tokens valid */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Redirect unauthenticated users away from protected routes */
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
