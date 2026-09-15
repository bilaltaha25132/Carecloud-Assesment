import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// UX gate only: it bounces anonymous visitors to /login so they never land on a
// half-rendered shell. The authoritative check is requireSession() in the
// server components under app/(app).

const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublic || request.cookies.has('session')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
