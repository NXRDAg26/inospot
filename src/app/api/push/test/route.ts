import { notifyAll } from '@/lib/push';

export async function POST() {
  const sent = await notifyAll('Inospot', 'Test alert: this device will get the pick of the day.', '/');
  if (!sent) return Response.json({ error: 'No alert was sent. Check the VAPID keys and that this device is subscribed.' }, { status: 400 });
  return Response.json({ sent });
}
