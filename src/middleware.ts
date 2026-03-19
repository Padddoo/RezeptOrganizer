import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, auth API, and static files
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get('rezept-auth');
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }

  // API routes get 401, pages get redirected to login
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
