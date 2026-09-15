import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Demo gate, not real security: one shared credential signs a stateless cookie.
// There is no user store, no rotation and no server-side revocation.

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

interface SessionPayload {
  u: string;
  iat: number;
}

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET ?? '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createSessionCookieValue(username: string): string {
  const payload: SessionPayload = { u: username, iat: Date.now() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export async function verifySession(): Promise<{ username: string } | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [encoded, signature] = raw.split('.');
  if (!encoded || !signature) return null;
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    if (Date.now() - payload.iat > SESSION_MAX_AGE_SECONDS * 1000) return null;
    return { username: payload.u };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<{ username: string }> {
  const session = await verifySession();
  if (!session) redirect('/login');
  return session;
}
