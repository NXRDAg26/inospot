import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fmtPrice, Spark } from '@/components/Board';
import { IconBack } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { pct, shortDate, tone } from '@/lib/format';

export default async function MarketDetail({ params }: { params: { id: string } }) {
  const scan = await getScan();
  const m = (scan.markets ?? []).find((x) => x.id === params.id);
  if (!m) notFound();
  const s = m.series ?? [];
  const up = s.length > 1 ? s[s.length - 1] >= s[0] : (m.change_1m ?? 0) >= 0;
  const hi = s.length ? Math.max(...s) : null;
  const lo = s.length ? Math.min(...s) : null;
  const related = (scan.insights ?? []).filter((i) => i.rows.some((r) => r.href === `/markets/${m.id}`));
  return (
    <div className="page">
      <MobileTop />
      <Link href="/markets" className="back"><IconBack />Markets</Link>
      <div className="stamp">{m.group}, {m.symbol}</div>
      <h1 className="d-tk" style={{ marginTop: 8 }}>{m.name}</h1>
      <div className="d-price">
        <span className="num">{fmtPrice(m.price, m.unit, m.decimals)}</span>
        <span className={`chip ${tone(m.change_1d)}`}>{pct(m.change_1d, 2)} today</span>
      </div>
      {m.read && <p className="lead" style={{ marginTop: 14 }}>{m.read}</p>}

      {s.length > 1 ? (
        <div className="bigchart">
          <div className="bigchart-lab"><span>High {fmtPrice(hi, m.unit, m.decimals)}</span><span>Low {fmtPrice(lo, m.unit, m.decimals)}</span></div>
          <Spark series={s} up={up} height={180} />
          <div className="bigchart-foot"><span>30 trading days</span><span>{m.series_note}</span></div>
        </div>
      ) : null}

      <div className="figs four">
        <div className="fig"><div className="k">Day</div><div className={`v num ${tone(m.change_1d)}`}>{pct(m.change_1d, 2)}</div></div>
        <div className="fig"><div className="k">5 days</div><div className={`v num ${tone(m.change_5d)}`}>{pct(m.change_5d, 2)}</div></div>
        <div className="fig"><div className="k">1 month</div><div className={`v num ${tone(m.change_1m)}`}>{pct(m.change_1m, 2)}</div></div>
        <div className="fig"><div className="k">This year</div><div className={`v num ${tone(m.change_ytd)}`}>{pct(m.change_ytd, 1)}</div></div>
      </div>

      {related.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Appears in</h2></div>
          <div className="rows">
            {related.map((i) => {
              const pos = i.rows.findIndex((r) => r.href === `/markets/${m.id}`) + 1;
              return (
                <Link key={i.id} href={`/insights/${i.id}`} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                  <div><div className="row-name">{i.title}</div><div className="row-sub">{i.period}</div></div>
                  <div className="row-end"><div className="v num">#{pos}</div></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <p className="foot">Captured by the {shortDate(scan.scanned_at)} scan from Bigdata.com and Alpha Vantage. Not a live quote.</p>
    </div>
  );
}
