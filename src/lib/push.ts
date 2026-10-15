import webpush from 'web-push';
import { db, hasDb } from './db';

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:james@nx-rd.com', pub, priv);
  configured = true;
  return true;
}

export async function saveSubscription(sub: { endpoint: string }) {
  const pool = await db();
  await pool.query(
    `insert into push_subs (endpoint, sub) values ($1, $2)
     on conflict (endpoint) do update set sub = excluded.sub`,
    [sub.endpoint, sub]
  );
}

export async function notifyAll(title: string, body: string, url = '/'): Promise<number> {
  if (!hasDb() || !configure()) return 0;
  const pool = await db();
  const r = await pool.query('select endpoint, sub from push_subs');
  let sent = 0;
  for (const row of r.rows) {
    try {
      await webpush.sendNotification(row.sub, JSON.stringify({ title, body, url }));
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await pool.query('delete from push_subs where endpoint = $1', [row.endpoint]);
    }
  }
  return sent;
}
