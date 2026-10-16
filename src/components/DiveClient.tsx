'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DiveRunner({ ticker, pendingId, label = 'Run a deep dive', enabled, note }: { ticker: string; pendingId?: number | null; label?: string; enabled: boolean; note?: string }) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(pendingId ?? null);
  const [stage, setStage] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(Boolean(pendingId));

  useEffect(() => {
    if (!id) return;
    let stop = false;
    const tick = async () => {
      const r = await fetch(`/api/dive/${id}`).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (stop) return;
      if (j.status === 'ready') { setBusy(false); router.refresh(); return; }
      if (j.status === 'failed') { setBusy(false); setErr(j.error || 'The deep dive failed. Try again.'); setId(null); return; }
      setStage(j.stage || 'Working');
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [id, router]);

  async function start() {
    setErr(''); setBusy(true); setStage('Starting');
    const r = await fetch('/api/dive', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ticker }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(false); setErr(j.error || 'Could not start the deep dive.'); return; }
    setId(j.id);
  }

  return (
    <div className="runner">
      {busy ? (
        <div className="runner-busy" role="status">
          <span className="spinner" aria-hidden="true" />
          <div><b>Researching {ticker}</b><span className="muted">{stage}. This takes one to two minutes; you can leave the page and come back.</span></div>
        </div>
      ) : (
        <button className="btn dive-btn" onClick={start} disabled={!enabled}>{label}</button>
      )}
      {!enabled && !busy && note && <p className="muted small-note">{note}</p>}
      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  );
}

export function DiveSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      className="dsearch"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim().toUpperCase();
        if (t) router.push(`/research/dive/${encodeURIComponent(t)}`);
      }}
    >
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticker, e.g. NVDA or BARC.L" aria-label="Ticker to research" autoCapitalize="characters" autoComplete="off" />
      <button className="btn" type="submit">Deep dive</button>
    </form>
  );
}
