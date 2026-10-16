import { createPendingDive, latestDive, livesToday, normTicker, requestDive } from '@/lib/alerts';
import { hasDb } from '@/lib/db';
import { hasLiveDives, runLiveDive } from '@/lib/deepdive';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ticker = normTicker(body.ticker);
  if (!ticker) return Response.json({ error: 'Enter a ticker, for example AAPL or PSN.L' }, { status: 400 });
  if (!hasDb()) return Response.json({ error: 'Inospot has no database connected.' }, { status: 503 });
  const { pending } = await latestDive(ticker);
  if (pending) return Response.json({ id: pending.id, ticker, status: pending.status, mode: pending.source === 'request' ? 'request' : 'live' });
  if (!hasLiveDives()) {
    // No API key: queue it for the next scheduled research run (uses the Claude plan, no extra cost)
    const id = await requestDive(ticker);
    return Response.json({ id, ticker, status: 'queued', mode: 'request' });
  }
  if ((await livesToday()) >= 25) return Response.json({ error: 'That is 25 live deep dives in 24 hours, the daily safety limit. Try again tomorrow.' }, { status: 429 });
  const id = await createPendingDive(ticker);
  void runLiveDive(id, ticker); // runs in the background on the server
  return Response.json({ id, ticker, status: 'queued', mode: 'live' });
}
