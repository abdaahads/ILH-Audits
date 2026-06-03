/**
 * SERVER-SIDE SUPABASE CLIENT — src/lib/supabase/server.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This creates the Supabase client used in Server Components, Server Actions,
 * and Route Handlers. Unlike the browser client (which relies on the browser
 * to manage session state), this client securely extracts the user's
 * authentication token from the Next.js `cookies()` store.
 *
 * WHY IT MATTERS FOR ILH:
 * This enables Server-Side Rendering (SSR). For example, when an operations
 * manager navigates to the CAP Board (Issues page), the server fetches their
 * assigned issues directly from the database and renders the HTML *before*
 * sending it to the device. This provides a much faster, flicker-free
 * experience, especially for users on slow 4G networks at property sites.
 *
 * FOR DEVELOPERS:
 * - Next.js 15 BREAKING CHANGE: The `cookies()` API is now async. Therefore,
 *   this `createClient()` function must be `await`ed before use.
 * - Read-Only Constraint: In Server Components, cookies cannot be modified
 *   (e.g., if a token needs refreshing). The `try/catch` block ignores
 *   the set error, deferring the token refresh to `middleware.ts`, which
 *   *can* write cookies.
 * - Like the browser client, this implements the Proxy pattern to fallback
 *   to the `mockClient.ts` if environment variables are missing.
 * ============================================================
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { mockSupabase } from './mockClient';

export async function createClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock = 
    !rawUrl || 
    !rawKey || 
    rawUrl.includes("YOUR_PROJECT_URL") || 
    rawKey.includes("YOUR_PUBLISHABLE_KEY") || 
    rawUrl.includes("your_project_url_here") || 
    rawUrl.includes("placeholder-project") ||
    !rawUrl.startsWith("http");

  const url = isMock ? "https://placeholder-project.supabase.co" : rawUrl;
  const key = isMock ? "placeholder-key" : rawKey;

  const client = createServerClient(
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

  if (isMock) {
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === 'from') {
          return (tableName: string) => mockSupabase.from(tableName);
        }
        if (prop === 'auth') {
          return mockSupabase.auth;
        }
        if (prop === 'storage') {
          return mockSupabase.storage;
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }

  return client;
}
