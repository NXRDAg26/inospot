import { hasDb } from '@/lib/db';
import { saveSubscription } from '@/lib/push';

export async function POST(req: Request) {
  if (!hasDb()) return Response.json({ error: 'The database isn’t connected yet.' }, { status: 503 });
  const sub = await req.json().catch(() => null);
  if (!sub || typeof sub.endpoint !== 'string') return Response.json({ error: 'Invalid subscription.' }, { status: 400 });
  await saveSubscription(sub);
  return Response.json({ ok: true });
}
