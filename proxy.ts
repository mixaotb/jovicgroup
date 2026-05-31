// proxy.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function makeSupabaseClient(request: NextRequest, response: { current: NextResponse }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response.current = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.current.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  const isCrmSubdomain = host === 'crm.jovicgroup.com' || host.startsWith('crm.jovicgroup.com:');

  if (isCrmSubdomain) {
    // On the CRM subdomain, /login maps to /crm/login; everything else to /crm<path>
    const isLoginPage = pathname === '/login' || pathname === '/login/';

    if (!isLoginPage) {
      try {
        const res = { current: NextResponse.next({ request }) };
        const supabase = makeSupabaseClient(request, res);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
      } catch {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }

    // Rewrite subdomain path → /crm/* internally (browser URL stays clean)
    const internalPath = isLoginPage
      ? '/crm/login'
      : pathname === '/'
        ? '/crm/dashboard'
        : pathname.startsWith('/api/')
          ? pathname
          : `/crm${pathname}`;

    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  // ── Main domain: redirect /crm/* → crm.jovicgroup.com ───────────────────

  if (pathname.startsWith('/crm')) {
    const crmPath = pathname.replace(/^\/crm/, '') || '/';
    const url = request.nextUrl.clone();
    url.host = 'crm.jovicgroup.com';
    url.pathname = crmPath;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}