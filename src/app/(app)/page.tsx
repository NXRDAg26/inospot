import Link from 'next/link';
import { IdeaRow, Range } from '@/components/Bits';
import { InsightHero, MarketBoard } from '@/components/Board';
import { MobileTop } from '@/components/Nav';
import { getScan, pickOfDay, ranked } from '@/lib/data';
import { pct, shortDate, whenLabel, daysUntil } from '@/lib/format';

function greeting() {
  const h = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const moodColour = (r: string) => {
  const l = r.toLowerCase();
  return l.includes('off') ? 'var(--loss)' : l.includes('on') ? 'var(--gain)' : 'var(--amber)';
};

export default async function Today() {
  const scan = await getScan();
  const list = ranked(scan.opps);
  const pick = pickOfDay(list);
  const others = list.filter((o) => o.ticker !== pick?.ticker && o.rating !== 'Avoid').slice(0, 4);
  const counts = {
    all: list.length,
    strong: list.filter((o) => o.rating === 'Strong').length,
    watch: list.filter((o) => o.rating === 'Watch').length,
    avoid: list.filter((o) => o.rating === 'Avoid').length,
  };
  const upcoming = [...scan.calendar].filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const stories = [...scan.news].sort((a, b) => a.rank - b.rank).slice(0, 3);

  return (
    <div className="page">
      <MobileTop />
      <header className="ph">
        <div className="stamp">Scan from {shortDate(scan.scanned_at)}</div>
        <h1 style={{ marginTop: 6 }}>{greeting()}, James</h1>
      </header>

      {pick && (
        <Link href={`/ideas/${encodeURIComponent(pick.ticker)}`} className="pick">
          <div className="pick-top">
            <span>Pick of the day</span>
            <span className="score" aria-label={`Score ${pick.score} out of 100`}>{pick.score}</span>
          </div>
          <div className="pick-tk">{pick.ticker}</div>
          <div className="pick-nm">{pick.name}, {pick.sector}</div>
          <p className="pick-why">{pick.why}</p>
          <div className="pick-figs">
            <div><div className="k">Middle case</div><div className="v num">{pct(pick.ret_base)}</div></div>
            <div><div className="k">Next event</div><div className="v" style={{ fontWeight: 750, fontSize: '1.05rem', paddingTop: 6 }}>{pick.catalyst || 'None set'}{pick.catalyst_date ? `, ${shortDate(pick.catalyst_date)}` : ''}</div></div>
          </div>
          <div style={{ marginTop: 22 }}><Range bear={pick.ret_bear} base={pick.ret_base} bull={pick.ret_bull} light /></div>
          <span className="pick-cta">Read the full case</span>
        </Link>
      )}

      <div className="mood" style={{ marginTop: 28 }}>
        <span className="mood-dot" style={{ background: moodColour(scan.note.regime) }} />
        <div><b>{scan.note.regime}.</b> <span className="muted">{scan.note.top_title}.</span></div>
      </div>
      <div className="counts">
        <div className="count"><div className="v num">{counts.all}</div><div className="k">On the radar</div></div>
        <div className="count"><div className="v num gain">{counts.strong}</div><div className="k">Strong</div></div>
        <div className="count"><div className="v num" style={{ color: 'var(--amber)' }}>{counts.watch}</div><div className="k">Watch</div></div>
        <div className="count"><div className="v num loss">{counts.avoid}</div><div className="k">Avoid</div></div>
      </div>

      {scan.markets && scan.markets.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Markets now</h2><Link className="more" href="/markets">All markets</Link></div>
          <MarketBoard markets={scan.markets} group="Popular" limit={5} />
        </section>
      )}

      <section className="block">
        <div className="block-head"><h2>Also worth a look</h2><Link className="more" href="/ideas">All ideas</Link></div>
        <div className="rows">{others.map((o) => <IdeaRow key={o.ticker} o={o} />)}</div>
      </section>

      {scan.insights && scan.insights.some((i) => i.kind === 'hero') && (
        <section className="block">
          <div className="block-head"><h2>Insights</h2><Link className="more" href="/insights">All insights</Link></div>
          <div className="ins-heroes compact">
            {scan.insights.filter((i) => i.kind === 'hero').map((h, i) => <InsightHero key={h.id} ins={h} i={i} />)}
          </div>
        </section>
      )}

      <section className="block">
        <div className="block-head"><h2>Coming up</h2><Link className="more" href="/calendar">Calendar</Link></div>
        <div className="rows">
          {upcoming.map((e) => (
            <div className="row" key={e.date + e.event} style={{ gridTemplateColumns: '44px 1fr auto' }}>
              <span className="mono" style={{ fontSize: 11, lineHeight: 1.05, textAlign: 'center', whiteSpace: 'pre-line' }}>{shortDate(e.date).replace(' ', '\n')}</span>
              <div><div className="row-name">{e.event}</div><div className="row-sub">{e.related}</div></div>
              <div className="row-end"><div className="k" style={{ fontSize: 13 }}>{whenLabel(e.date)}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head"><h2>Moving markets</h2><Link className="more" href="/markets">Morning note</Link></div>
        <div>
          {stories.map((n) => (
            <div className="impact" key={n.rank}>
              <div className="impact-top"><span className="t">{n.event}</span><span className="num" style={{ fontSize: 15 }}>{n.score.toFixed(1)}</span></div>
              <div className="x">{n.reaction}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="foot">Inospot is a research aid, not financial advice. Scores and return ranges are judgements drawn from the linked news and analyst moves, not forecasts.</p>
    </div>
  );
}
