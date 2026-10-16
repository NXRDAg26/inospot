import Link from 'next/link';
import { IconBack } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { list as split, longDate, shortDate } from '@/lib/format';

export default async function MorningNote() {
  const scan = await getScan();
  const n = scan.note;
  const news = [...scan.news].sort((a, b) => a.rank - b.rank);
  const max = Math.max(...news.map((x) => x.score), 1);
  return (
    <div className="page">
      <MobileTop />
      <Link href="/markets" className="back"><IconBack />Markets</Link>
      <div className="stamp">Morning note, {longDate(n.date)}</div>
      <h1 className="note-h" style={{ marginTop: 10 }}>{n.top_title}</h1>
      <p className="muted" style={{ marginTop: 10, fontWeight: 650 }}>Market mood: {n.regime}</p>
      <p className="lead">{n.top_call}</p>

      <section className="block cols2">
        <div><h3 className="small">Overnight</h3><ul className="points">{split(n.developments).map((p) => <li key={p}>{p}</li>)}</ul></div>
        <div><h3 className="small">Dates ahead</h3><ul className="points">{split(n.events).map((p) => <li key={p}>{p}</li>)}</ul></div>
      </section>

      <div className="trade"><b>Trade idea</b>{n.trade}</div>

      <section className="block">
        <div className="block-head"><h2>What moved markets</h2><span className="muted" style={{ fontSize: 14 }}>Last 10 days, by impact</span></div>
        {news.map((x) => (
          <div className="impact" key={x.rank}>
            <div className="impact-top"><span className="t">{x.event}</span><span className="num" style={{ fontSize: 15 }}>{x.score.toFixed(1)}</span></div>
            <div className="bar"><i style={{ width: `${(x.score / max) * 100}%` }} /></div>
            <div className="x">{x.reaction}. {x.read}. <a href={x.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cobalt)', fontWeight: 700 }}>{shortDate(x.date)} source</a></div>
          </div>
        ))}
        <p className="foot">Impact weighs how far prices moved, how many markets moved, and whether the news signals a lasting shift.</p>
      </section>
    </div>
  );
}
