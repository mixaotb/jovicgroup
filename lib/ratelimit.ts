import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Returns the real client IP set by the trusted reverse proxy (rightmost in XFF chain).
// Attackers can inject fake IPs at the start of X-Forwarded-For; only the last entry
// is added by infrastructure (Vercel/Nginx/Cloudflare) and can be trusted.
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const last = forwarded.split(',').at(-1)?.trim();
    if (last) return last;
  }

  return 'unknown';
}

// DB-backed rate limiter — safe for serverless/multi-instance deployments.
// Falls open on DB errors to avoid blocking legitimate traffic.
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error) {
      console.error('[RateLimit] DB error, allowing request:', error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error('[RateLimit] Unexpected error:', err);
    return true;
  }
}
