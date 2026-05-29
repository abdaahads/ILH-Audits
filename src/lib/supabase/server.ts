/**
 * Server-side Supabase client
 *
 * Use this in Server Components, Server Actions, and Route Handlers.
 * The client reads/writes auth tokens via the Next.js cookie store.
 *
 * NOTE: This function is async because `cookies()` returns a Promise
 * in Next.js 15.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The middleware will handle the refresh instead.
          }
        },
      },
    }
  );
}
