import { getHistory } from '@/lib/prices';

export const dynamic = 'force-dynamic';

// /api/health for Render; /api/health?prices=1 also checks the chart price feed.
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!url.searchParams.get('prices')) return Response.json({ ok: true });
  const out: Record<string, string> = {};
  for (const s of ['SPY', 'PSN.L']) {
    const h = await getHistory(s).catch(() => null);
    out[s] = h ? `${h.source}, ${h.points.length} days` : 'unavailable';
  }
  return Response.json({ ok: true, prices: out, live_dives: Boolean(process.env.ANTHROPIC_API_KEY) });
}
