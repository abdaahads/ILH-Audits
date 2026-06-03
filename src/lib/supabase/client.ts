/**
 * BROWSER-SIDE SUPABASE CLIENT — src/lib/supabase/client.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This file creates the Supabase client used in Client Components
 * (files with "use client" at the top). It automatically manages
 * authentication tokens in the browser and handles API requests
 * to the Supabase backend.
 *
 * WHY IT MATTERS FOR ILH (THE PROXY PATTERN):
 * The CTO requested that this repository be made public. To ensure
 * the app can be evaluated without exposing production credentials,
 * this file implements a "Mock Fallback" system.
 * 
 * If the environment variables are missing (e.g., when a recruiter
 * or reviewer clones the repo), it detects this and wraps the client
 * in a JavaScript `Proxy`. This proxy intercepts all database calls
 * and redirects them to the `mockClient.ts` (LocalStorage), allowing
 * the app to function perfectly as a sandbox demo without a real backend.
 *
 * FOR DEVELOPERS:
 * - This uses `@supabase/ssr` which securely manages session cookies
 *   under the hood.
 * - The Proxy pattern intercepts `.from()`, `.auth`, and `.storage`.
 *   If the credentials are valid, the Proxy is skipped, and it connects
 *   to the real ILH production database.
 * ============================================================
 */

import { createBrowserClient } from '@supabase/ssr';
import { mockSupabase } from './mockClient';

export function createClient() {
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
  const client = createBrowserClient(url, key);

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
