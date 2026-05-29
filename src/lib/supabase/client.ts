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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  const client = createBrowserClient(url, key);

  const isMock = 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    url.includes("YOUR_PROJECT_URL") || 
    key.includes("YOUR_PUBLISHABLE_KEY") || 
    url.includes("your_project_url_here") || 
    url.includes("placeholder-project");

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
