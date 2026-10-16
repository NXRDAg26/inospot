import Link from 'next/link';
import { Mono } from '@/components/Bits';
import { DiveSearch } from '@/components/DiveClient';
import { recentDives } from '@/lib/alerts';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { pct, tone } from '@/lib/format';
import type { WatchItem } from '@/lib/types';

const FILTERS: Record<string, (w: WatchItem) => boolean> = {
  All: () => true,
  Shares: (w) => w.asset === 'Equity',
  'Sectors and funds': (w) => w.asset === 'Sector' || w.asset === 'ETF',
  Bonds: (w) => w.asset === 'Bond',
  Commodities: (w) => w.asset === 'Commodity',
  UK: (w) => w.region === 'UK',
};

const KIND: Record<string, string> = { Equity: 'shares', Sector: 'sector', ETF: 'fund', Bond: 'bonds', Commodity: 'commodity' };
const arrow = (d: string) => (d === 'Heating' ? '↑' : d === 'Cooling' ? '↓' : '→');
const dirTone = (d: string) => (d === 'Heating' || d === 'Rising' ? 'gain' : d === 'Cooling' || d === 'Falling' ? 'loss' : 'flat');

export default async function Research({ searchParams }: { searchParams: { f?: string } }) {
  const [scan, dives] = await Promise.all([getScan(), recentDives(8).catch(() => [])]);
  const themes = [...scan.themes].sort((a, b) => b.heat - a.heat);
  const f = searchParams.f && FILTERS[searchParams.f] ? searchParams.f : 'All';
  const watch = [...scan.watch].sort((a, b) => b.heat - a.heat).filter(FILTERS[f]);
  return (
    <div className="page">
      <MobileTop />
      <header className="ph">
        <h1>Research</h1>
        <p>What the wider market is doing across shares, funds, bonds and commodities, and what might earn a place on the radar next.</p>
      </header>

      <section className="dive-hero">
        <h2>Deep dive any stock</h2>
        <p className="muted">Pulls results, news, analyst views and valuation from across the web, with performance charts. Add .L for London listings.</p>
        <DiveSearch />
        {dives.length > 0 && (
          <div className="dive-recent">
            <span className="muted">Recent:</span>
            {dives.map((r) => (
              <Link key={r.id + r.ticker} href={`/research/dive/${encodeURIComponent(r.ticker)}`} className="dchip">
                <b>{r.ticker}</b>{r.data?.verdict ? <span>{r.data.verdict}</span> : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <div className="block-head"><h2>Hot themes</h2><span className="muted" style={{ fontSize: 14 }}>Heat out of 100</span></div>
        <div className="themes">
          {themes.map((t, i) => (
            <div key={t.theme} className={`theme ${i === 0 ? 'hot' : ''}`}>
              <div className="t">{t.theme}</div>
              <div className="h num">{t.heat}</div>
              <div className={`dir ${i === 0 ? '' : dirTone(t.direction)}`}>{arrow(t.direction)} {t.direction}</div>
              <div className="m">{t.measure}</div>
              <div className="r">{t.read}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head" style={{ flexWrap: 'wrap' }}>
          <h2>Watchlist</h2>
          <div className="seg" role="navigation" aria-label="Filter watchlist">
            {Object.keys(FILTERS).map((k) => (
              <Link key={k} href={k === 'All' ? '/research' : `/research?f=${encodeURIComponent(k)}`} aria-current={k === f ? 'true' : undefined} scroll={false}>{k}</Link>
            ))}
          </div>
        </div>
        <div className="rows">
          {watch.map((w) => (
            <Link key={w.id} href={`/research/${encodeURIComponent(w.id)}`} className="row">
              <Mono ticker={w.ticker} />
              <div>
                <div className="row-name">{w.name}</div>
                <div className="row-sub">{w.stance}, {KIND[w.asset] ?? w.asset.toLowerCase()}, {w.region}</div>
              </div>
              <div className="row-end">
                <div className={`v num ${tone(w.move_1w)}`}>{pct(w.move_1w, 1)}</div>
                <div className="k">5 days</div>
              </div>
            </Link>
          ))}
          {!watch.length && <p className="muted" style={{ padding: '18px 0' }}>Nothing on the watchlist in this group today.</p>}
        </div>
      </section>
    </div>
  );
}
