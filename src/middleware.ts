/**
 * Next.js Middleware
 *
 * Runs on every matched request to refresh the Supabase auth session
 * and enforce route-level authentication.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
