// Live deep dive: researches one stock with Claude (web search) and stores the result.
import { updateDive } from './alerts';
import { benchFor, getHistory, perfFromHistory } from './prices';
import type { Dive } from './types';

export const hasLiveDives = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const SCHEMA = `{
  "ticker": "exchange ticker as given",
  "name": "company name",
  "exchange": "e.g. NASDAQ, NYSE, LSE",
  "currency": "$ for US dollars, GBp for London pence, € for euros, otherwise the ISO code",
  "chart_symbol": "Yahoo Finance symbol, e.g. AAPL or PSN.L",
  "market": "UK, US or Global",
  "sector": "short sector name",
  "price": number,
  "change_1d": number (percent),
  "range_52w": {"low": number, "high": number},
  "verdict": "Worth a closer look" | "Wait for a better entry" | "Avoid for now",
  "verdict_line": "one sentence saying why",
  "summary": "3 to 4 sentences: what the company does, what is happening now, what it means for an investor",
  "why_moving": "2 to 3 sentences on the recent share price move and its cause",
  "opportunity": 0-100, "risk": 0-100,
  "ret_bear": integer percent, "ret_base": integer percent, "ret_bull": integer percent (3 to 6 months, between -50 and 40),
  "horizon": "e.g. 3 to 6 months",
  "bull_case": ["3 to 5 short points"],
  "bear_case": ["3 to 5 short points"],
  "key_numbers": [{"label": "Market value", "value": "$1.05tn", "note": "optional"}] (6 to 10 items: market value, P/E or forward P/E, revenue growth, margin, dividend yield, net debt or cash, latest results beat or miss, anything else material),
  "analysts": {"buy": n, "hold": n, "sell": n, "target_low": number, "target_mean": number, "target_high": number} or null,
  "sentiment": {"tone": "Bullish" | "Mixed" | "Bearish", "bullish": n, "bearish": n, "note": "one line"} (count of positive vs negative stories you found this week),
  "news": [{"date": "YYYY-MM-DD", "title": "paraphrased headline", "source": "publisher", "url": "link", "tone": "Positive" | "Negative" | "Neutral", "why": "one line on why it matters"}] (5 to 8 items, newest first),
  "catalysts": [{"date": "YYYY-MM-DD", "event": "results, data readout, AGM, policy decision"}] (confirmed dates only),
  "watch": ["2 to 4 things that would change the view"],
  "sources": [{"title": "...", "url": "..."}]
}`;

function prompt(ticker: string, facts: string) {
  return `You are the research engine inside Inospot, a private investment research app for a UK-based investor with a medium-term (weeks to months), balanced-risk approach. Do a deep dive on the stock "${ticker}".

Search the web thoroughly (company results and guidance, recent news, analyst ratings and price targets, valuation, upcoming dates, risks). Use only facts from sources you actually retrieved, paraphrase rather than quote, and write in British English. Never use em dashes.

Price facts already measured by the app (trust these over anything you find):
${facts || 'None available: find the latest price yourself.'}

Reply with ONLY one JSON object, no prose before or after, matching this shape:
${SCHEMA}

This is research, not financial advice, so be balanced and specific about risks.`;
}

type Block = { type: string; text?: string };

async function callClaude(content: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY!;
  const messages: { role: string; content: unknown }[] = [{ role: 'user', content }];
  for (let turn = 0; turn < 4; turn++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL(),
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
        messages,
      }),
    });
    if (!r.ok) throw new Error(`Claude API ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = (await r.json()) as { content: Block[]; stop_reason: string };
    if (j.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: j.content });
      continue;
    }
    return j.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }
  throw new Error('Research took too many steps');
}

function parseDive(text: string): Dive {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('No research result came back');
  const d = JSON.parse(text.slice(a, b + 1)) as Dive;
  if (!d.name || !d.summary) throw new Error('The research result was incomplete');
  d.bull_case = Array.isArray(d.bull_case) ? d.bull_case : [];
  d.bear_case = Array.isArray(d.bear_case) ? d.bear_case : [];
  return d;
}

const guessSymbol = (t: string) => t; // Yahoo symbols: US tickers as-is, London as XXX.L

export async function runLiveDive(id: number, ticker: string) {
  try {
    await updateDive(id, { status: 'running', stage: 'Fetching prices' });
    const hist = await getHistory(guessSymbol(ticker));
    let facts = '';
    if (hist) {
      const pts = hist.points;
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const perf = perfFromHistory(pts);
      const lo = Math.min(...pts.map((p) => p.c));
      const hi = Math.max(...pts.map((p) => p.c));
      facts = [
        `Last close ${last.c} ${hist.currency ?? ''} on ${new Date(last.t).toISOString().slice(0, 10)} (${(((last.c - prev.c) / prev.c) * 100).toFixed(2)}% on the day)`,
        `52-week range ${lo} to ${hi}`,
        ...Object.entries(perf).map(([k, v]) => `${k}: ${v === null ? 'n/a' : v.toFixed(1) + '%'}`),
      ].join('\n');
    }
    await updateDive(id, { stage: 'Researching news, results and analysts' });
    const text = await callClaude(prompt(ticker, facts));
    await updateDive(id, { stage: 'Writing it up' });
    const d = parseDive(text);
    d.ticker = ticker;
    if (!d.chart_symbol && hist) d.chart_symbol = hist.symbol;
    const bench = benchFor(d.market, d.chart_symbol);
    d.bench_symbol = bench.symbol;
    d.bench_name = bench.name;
    d.generated_by = `Claude (${MODEL()}) with web search`;
    await updateDive(id, { status: 'ready', stage: 'Done', data: d });
  } catch (e) {
    await updateDive(id, { status: 'failed', stage: 'Failed', error: e instanceof Error ? e.message : String(e) });
  }
}
