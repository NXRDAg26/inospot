import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InsightTable } from '@/components/Board';
import { IconBack, InsightIcon } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { shortDate } from '@/lib/format';

export default async function InsightPage({ params }: { params: { id: string } }) {
  const scan = await getScan();
  const all = scan.insights ?? [];
  const ins = all.find((i) => i.id === params.id);
  if (!ins) notFound();
  const twin = ins.pair ? all.find((i) => i.pair === ins.pair && i.id !== ins.id) : undefined;
  return (
    <div className="page wide">
      <MobileTop />
      <h1 className="ins-title">{ins.title}</h1>
      <div className="ins-meta">
        <Link href="/insights" className="ins-back"><IconBack />All insights</Link>
        <span>{ins.period}</span>
        <span>{ins.rows.length} results</span>
        {twin && <Link href={`/insights/${twin.id}`} className="ins-twin">Switch to {twin.title.toLowerCase()}</Link>}
      </div>
      {ins.blurb && <p className="muted" style={{ marginTop: 14, maxWidth: '62ch' }}>{ins.blurb}</p>}

      <div className="ins-results">
        <h2><InsightIcon name={ins.icon} />Top results</h2>
        <span className="basis"><span className="live" aria-hidden="true" />{ins.basis}</span>
      </div>

      <InsightTable ins={ins} />

      <p className="foot">From the {shortDate(scan.scanned_at)} scan. Volume and prices come from Alpha Vantage and Bigdata.com; news tone and analyst ratings from Bigdata.com. Research aid, not financial advice.</p>
    </div>
  );
}
