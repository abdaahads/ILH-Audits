/**
 * Browser-side Supabase client
 *
 * Import this in Client Components ("use client") to interact with
 * Supabase from the browser. The client automatically handles cookie-
 * based auth token management via @supabase/ssr.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient(url, key);
}
