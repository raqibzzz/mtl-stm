import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/mtl\/@(.+)$/);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/mtl/${match[1]}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/mtl/:path*',
};
