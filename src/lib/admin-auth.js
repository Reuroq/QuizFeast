/**
 * Single-owner admin auth for the forms admin UI.
 *
 * Set ADMIN_TOKEN in env (a long random string). Login posts that token,
 * we set an HttpOnly cookie. Any /admin or admin-API route checks the cookie.
 *
 * This is intentionally simple — QuizFeast has no auth system today, and
 * the forms admin is for a single owner (Dwayne). If multi-tenant ever
 * arrives, swap this for Supabase auth (same pattern as receipts.law).
 */
import { cookies } from 'next/headers';

const COOKIE = 'qf_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function adminToken() {
  return (process.env.ADMIN_TOKEN || '').trim();
}

export function isAdminAuthEnabled() {
  return !!adminToken();
}

/** Verify a token submitted via login form. */
export function verifyToken(token) {
  const expected = adminToken();
  if (!expected) return false;
  if (typeof token !== 'string' || token.length !== expected.length) return false;
  // constant-time compare
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Read the request cookie and check if it matches ADMIN_TOKEN. */
export function isAuthed(req) {
  // If no ADMIN_TOKEN is set, leave admin OPEN in dev. In prod (NODE_ENV=production)
  // we refuse admin access entirely when unset, to avoid accidental wide-open.
  if (!isAdminAuthEnabled()) {
    return process.env.NODE_ENV !== 'production';
  }
  try {
    // Route Handlers: cookies() from next/headers
    if (!req) {
      const c = cookies().get(COOKIE);
      return !!c && verifyToken(c.value);
    }
    // Middleware-like: read from req
    const c = req.cookies?.get?.(COOKIE);
    return !!c && verifyToken(c.value);
  } catch {
    return false;
  }
}

export function cookieOpts() {
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  };
}

export const ADMIN_COOKIE_NAME = COOKIE;
