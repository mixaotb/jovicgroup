import { createBrowserClient as _createBrowserClient, createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient as _createAdminBase } from '@supabase/supabase-js';

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}

// Service-role client — bypasses RLS. Server-only: never import in client components.
export function createAdminClient() {
  return _createAdminBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
