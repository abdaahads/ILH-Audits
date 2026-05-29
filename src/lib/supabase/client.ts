/**
 * Browser-side Supabase client
 *
 * Import this in Client Components ("use client") to interact with
 * Supabase from the browser. The client automatically handles cookie-
 * based auth token management via @supabase/ssr.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
