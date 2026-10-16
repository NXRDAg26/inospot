import { getDiveRecord } from '@/lib/alerts';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!hasDb()) return Response.json({ error: 'No database' }, { status: 503 });
  const rec = await getDiveRecord(Number(params.id));
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ id: rec.id, ticker: rec.ticker, status: rec.status, stage: rec.stage, error: rec.error });
}
