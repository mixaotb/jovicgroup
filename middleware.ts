import { handleRequest } from './proxy';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return handleRequest(request);
}

export const config = {
  matcher: ['/crm/:path*'],
};
