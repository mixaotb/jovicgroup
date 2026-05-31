import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  const isCrmSubdomain = host === 'crm.jovicgroup.com' || host.startsWith('crm.jovicgroup.com:');

  if (isCrmSubdomain) {
    const isLoginPage = pathname === '/login' || pathname === '/login/';
    const isApiPath = pathname.startsWith('/api/');

    if (!isLoginPage && !isApiPath) {
      const response = { current: NextResponse.next({ request }) };

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[], headers: Record<string, string>) => {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response.current = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.current.cookies.set(name, value, options)
              );
              Object.entries(headers).forEach(([key, value]) =>
                response.current.headers.set(key, value)
              );
            },
          },
        }
      );

      try {
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

    const internalPath = isLoginPage
      ? '/crm/login'
      : pathname === '/'
        ? '/crm/dashboard'
        : isApiPath
          ? pathname
          : `/crm${pathname}`;

    const url = request.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  // Main domain: redirect /crm/* → crm.jovicgroup.com
  if (pathname.startsWith('/crm')) {
    const url = request.nextUrl.clone();
    url.host = 'crm.jovicgroup.com';
    url.pathname = pathname.replace(/^\/crm/, '') || '/';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
};
