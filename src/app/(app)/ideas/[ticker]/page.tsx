import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono, Range } from '@/components/Bits';
import { IconBack } from '@/components/Icons';
import { getScan, ranked } from '@/lib/data';
import { list as split, pct, shortDate, tone } from '@/lib/format';

export default async function Idea({ params }: { params: { ticker: string } }) {
  const scan = await getScan();
  const o = ranked(scan.opps).find((x) => x.ticker === decodeURIComponent(params.ticker));
  if (!o) notFound();
  return (
    <div className="page">
      <Link href="/ideas" className="back"><IconBack />Ideas</Link>
      <div className="d-head">
        <Mono ticker={o.ticker} rating={o.rating} />
        <div>
          <div style={{ fontWeight: 750, fontSize: '1.1rem' }}>{o.name}</div>
          <div className="muted" style={{ fontSize: 14 }}>Number {o.rank} of {scan.opps.length} today</div>
        </div>
      </div>
      <div className="d-tk">{o.ticker}</div>
      <div className="tags">
        <span className={`tag ${o.rating}`}>{o.rating}</span>
        <span className="tag">{o.market}</span>
        <span className="tag">{o.sector}</span>
        <span className="tag">{o.signal}</span>
      </div>
      <Link href={`/research/dive/${encodeURIComponent(o.ticker)}`} className="btn dive-btn" style={{ marginTop: 18, display: 'inline-flex' }}>Deep dive into {o.ticker}</Link>

      <div className="figs">
        <div className="fig"><div className="k">Score</div><div className="v num">{o.score}</div></div>
        <div className="fig"><div className="k">Middle case</div><div className={`v num ${tone(o.ret_base)}`}>{pct(o.ret_base)}</div></div>
        <div className="fig"><div className="k">Time frame</div><div className="v" style={{ fontWeight: 750, fontSize: '1.05rem', paddingTop: 8 }}>{o.horizon}</div></div>
      </div>
      <div style={{ marginTop: 22 }}><Range bear={o.ret_bear} base={o.ret_base} bull={o.ret_bull} /></div>

      <section className="block">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 10 }}>Why it’s on the radar</h2>
        <p className="prose">{o.why}</p>
        <div style={{ marginTop: 18 }}>
          <div className="meter"><span className="k">Opportunity</span><span className="bar"><i style={{ width: `${o.opportunity}%`, background: 'var(--gain)' }} /></span><span className="v num">{o.opportunity}</span></div>
          <div className="meter"><span className="k">Risk</span><span className="bar"><i style={{ width: `${o.risk}%`, background: 'var(--loss)' }} /></span><span className="v num">{o.risk}</span></div>
        </div>
      </section>

      <section className="block cols2">
        <div><h3 className="small">In its favour</h3><ul className="points gain">{split(o.positives).map((p) => <li key={p}>{p}</li>)}</ul></div>
        <div><h3 className="small">Against it</h3><ul className="points loss">{split(o.negatives).map((p) => <li key={p}>{p}</li>)}</ul></div>
      </section>

      {o.thesis && (
        <section className="block callout">
          <h3>The case in one line</h3>
          <p className="prose">{o.thesis}</p>
          <dl className="kv">
            <dt>Status</dt><dd>{o.thesis_status}</dd>
            <dt>Conviction</dt><dd>{o.conviction}</dd>
            <dt>Next event</dt><dd>{o.catalyst || 'None set'}{o.catalyst_date ? `, ${shortDate(o.catalyst_date)}` : ''}</dd>
            <dt>Get out if</dt><dd>{o.stop_trigger}</dd>
          </dl>
        </section>
      )}

      <p className="src">Source: <a href={o.source_url} target="_blank" rel="noopener noreferrer">{o.source_title}</a></p>
      <p className="foot">First spotted {shortDate(o.spotted)}. A research aid, not financial advice.</p>
    </div>
  );
}
