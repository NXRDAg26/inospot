import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const form = await req.formData();
  const pw = String(form.get('password') ?? '');
  const nextRaw = String(form.get('next') ?? '/');
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';
  const base = new URL(req.url);
  if (!process.env.APP_PASSWORD || pw !== process.env.APP_PASSWORD) {
    return NextResponse.redirect(new URL(`/login?e=1&next=${encodeURIComponent(next)}`, base), 303);
  }
  const res = NextResponse.redirect(new URL(next, base), 303);
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: base.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
