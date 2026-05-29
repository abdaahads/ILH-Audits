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
