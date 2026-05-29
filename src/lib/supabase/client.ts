/**
 * Browser-side Supabase client
 *
 * Import this in Client Components ("use client") to interact with
 * Supabase from the browser. The client automatically handles cookie-
 * based auth token management via @supabase/ssr.
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
