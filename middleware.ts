import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect portal routes (except login)
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login')) {
    const session = request.cookies.get('rotaract_portal_session');
    if (!session?.value) {
      const loginUrl = new URL('/portal/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*'],
};
