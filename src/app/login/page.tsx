import { Mark } from '@/components/Icons';

export const metadata = { title: 'Sign in to Inospot' };

export default function Login({ searchParams }: { searchParams: { next?: string; e?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/';
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form method="post" action="/api/login" style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="brand-mark" style={{ width: 52, height: 52, borderRadius: 16 }}><Mark size={30} /></span>
        <div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '-0.04em' }}>Inospot</h1>
          <p className="muted" style={{ marginTop: 4 }}>Enter your password to see today’s ideas.</p>
        </div>
        <input type="hidden" name="next" value={next} />
        <label className="field">
          <span style={{ fontWeight: 650, fontSize: 14 }}>Password</span>
          <input className="input" type="password" name="password" autoComplete="current-password" required autoFocus />
        </label>
        {searchParams.e && <p className="err">That password didn’t match. Try again.</p>}
        <button className="btn" type="submit">Sign in</button>
      </form>
    </main>
  );
}
