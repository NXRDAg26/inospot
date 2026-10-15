import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionToken } from './lib/auth';

const OPEN = ['/login', '/api/login', '/api/mcp', '/api/health', '/manifest.webmanifest', '/sw.js', '/icons', '/favicon'];

export async function middleware(req: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next(); // no password set: open (local dev)
  const { pathname } = req.nextUrl;
  if (OPEN.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p))) return NextResponse.next();
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && cookie === (await sessionToken())) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
