import Link from 'next/link';
import { GROUPS, MarketBoard } from '@/components/Board';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { longDate, shortDate } from '@/lib/format';

export default async function Markets({ searchParams }: { searchParams: { g?: string } }) {
  const scan = await getScan();
  const markets = scan.markets ?? [];
  const g = (GROUPS as readonly string[]).includes(searchParams.g ?? '') ? searchParams.g! : 'Popular';
  const n = scan.note;
  return (
    <div className="page wide">
      <MobileTop />
      <header className="ph">
        <div className="stamp">Prices from the {shortDate(scan.scanned_at)} scan</div>
        <h1 style={{ marginTop: 6 }}>Markets</h1>
        <p>Indices, commodities, currencies and bonds at a glance. Tap any tile for the detail.</p>
      </header>

      {markets.length ? (
        <MarketBoard markets={markets} group={g} hrefFor={(x) => (x === 'Popular' ? '/markets' : `/markets?g=${encodeURIComponent(x)}`)} />
      ) : (
        <p className="muted">Market prices arrive with the next morning scan.</p>
      )}

      <Link href="/markets/note" className="note-card">
        <span className="stamp">Morning note, {longDate(n.date)}</span>
        <span className="note-card-t">{n.top_title}</span>
        <span className="muted">Market mood: {n.regime}. Read the note and what moved markets.</span>
      </Link>

      <p className="foot">Prices are closing or early-morning levels captured by the scan, not live quotes. Index charts follow the matching tracker fund, so the shape is right even where the level is the index.</p>
    </div>
  );
}
