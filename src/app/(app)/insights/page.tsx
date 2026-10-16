import { InsightHero, InsightPair } from '@/components/Board';
import { IconInsights } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import type { Insight } from '@/lib/types';

export default async function Insights() {
  const scan = await getScan();
  const all = scan.insights ?? [];
  const heroes = all.filter((i) => i.kind === 'hero');
  const pairs: [Insight, Insight][] = [];
  const seen = new Set<string>();
  for (const i of all.filter((x) => x.kind === 'pair')) {
    if (!i.pair || seen.has(i.pair)) continue;
    const two = all.filter((x) => x.pair === i.pair);
    if (two.length === 2) { pairs.push([two[0], two[1]]); seen.add(i.pair); }
  }
  return (
    <div className="page wide">
      <MobileTop />
      <header className="ins-head">
        <span className="ins-badge"><IconInsights /></span>
        <div>
          <h1>Insights</h1>
          <p className="muted">Ranked lists from volume, news tone and analyst ratings, rebuilt every morning.</p>
        </div>
      </header>

      {all.length === 0 ? (
        <p className="muted">Insights arrive with the next morning scan.</p>
      ) : (
        <>
          <div className="ins-heroes">{heroes.map((h, i) => <InsightHero key={h.id} ins={h} i={i} />)}</div>
          <div className="ins-pairs">{pairs.map(([a, b]) => <InsightPair key={a.id} a={a} b={b} />)}</div>
        </>
      )}

      <p className="foot">Trading platforms rank by what their own clients buy and sell. Inospot has no client book, so it ranks by public signals instead: US trading volume, the tone of scored news stories, and published analyst ratings. Research aid, not financial advice.</p>
    </div>
  );
}
