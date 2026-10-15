// Session token = SHA-256 of password + secret. Works in both the edge middleware and node routes.
export const SESSION_COOKIE = 'inospot_session';

export async function sessionToken(): Promise<string> {
  const pw = process.env.APP_PASSWORD ?? '';
  const secret = process.env.SESSION_SECRET ?? 'inospot-dev-secret';
  const bytes = new TextEncoder().encode(`${pw}::${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function authEnabled() {
  return Boolean(process.env.APP_PASSWORD);
}
