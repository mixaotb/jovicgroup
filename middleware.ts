import { handleRequest } from './proxy';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return handleRequest(request);
}

export const config = {
  // Match all paths except Next.js internals and static files so the
  // crm.jovicgroup.com subdomain can be caught regardless of path.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
};
