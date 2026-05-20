import { NextResponse } from 'next/server';
import { verifyToken, ADMIN_COOKIE_NAME, cookieOpts } from '@/lib/admin-auth';

export async function POST(request) {
  const { token } = await request.json().catch(() => ({}));
  if (!verifyToken(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const opts = cookieOpts();
  res.cookies.set(ADMIN_COOKIE_NAME, token, opts);
  return res;
}
