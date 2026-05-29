/**
 * Supabase middleware helper
 *
 * Refreshes the auth session on every request so tokens stay fresh,
 * and redirects unauthenticated users to /login for protected routes.
 *
 * Public routes that bypass the auth check:
 *  - /           (landing page)
 *  - /login      (sign-in page)
 *  - /auth/*     (OAuth callbacks)
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
