import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle root path
  if (pathname === '/') {
    // Check if user has a session token
    const token = await getToken({ req: request });

    if (token) {
      // Authenticated: redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard/banknotes', request.url));
    } else {
      // Unauthenticated: redirect to capture
      return NextResponse.redirect(new URL('/capture', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
