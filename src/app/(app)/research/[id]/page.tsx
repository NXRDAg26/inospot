import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/Bits';
import { IconBack } from '@/components/Icons';
import { getScan } from '@/lib/data';
import { pct, tone } from '@/lib/format';

export default async function WatchDetail({ params }: { params: { id: string } }) {
  const scan = await getScan();
  const w = scan.watch.find((x) => x.id === decodeURIComponent(params.id));
  if (!w) notFound();
  return (
    <div className="page">
      <Link href="/research" className="back"><IconBack />Research</Link>
      <div className="d-head">
        <Mono ticker={w.ticker} />
        <div>
          <div style={{ fontWeight: 750, fontSize: '1.1rem' }}>{w.name}</div>
          <div className="muted" style={{ fontSize: 14 }}>On the watchlist</div>
        </div>
      </div>
      <div className="d-tk">{w.ticker}</div>
      <div className="tags">
        <span className="tag">{w.stance}</span>
        <span className="tag">{w.asset}</span>
        <span className="tag">{w.region}</span>
        <span className="tag">{w.direction}</span>
      </div>
      <Link href={`/research/dive/${encodeURIComponent(w.ticker)}`} className="btn dive-btn" style={{ marginTop: 18, display: 'inline-flex' }}>Deep dive into {w.ticker}</Link>
      <div className="figs">
        <div className="fig"><div className="k">Heat</div><div className="v num">{w.heat}</div></div>
        <div className="fig"><div className="k">5 days</div><div className={`v num ${tone(w.move_1w)}`}>{pct(w.move_1w, 1)}</div></div>
        <div className="fig"><div className="k">3 months</div><div className={`v num ${tone(w.move_3m)}`}>{pct(w.move_3m, 1)}</div></div>
      </div>
      <section className="block">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 10 }}>Why it’s worth watching</h2>
        <p className="prose">{w.why}</p>
      </section>
      <section className="block callout">
        <h3>Moves onto the radar if</h3>
        <p className="prose">{w.trigger}</p>
      </section>
      <p className="src">Source: <a href={w.source_url} target="_blank" rel="noopener noreferrer">{w.source_title}</a></p>
    </div>
  );
}
