'use client';
import { useEffect, useState } from 'react';

function toKey(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = 'checking' | 'unsupported' | 'off' | 'on' | 'blocked' | 'unconfigured';

export default function AlertsClient({ vapidKey }: { vapidKey: string }) {
  const [state, setState] = useState<State>('checking');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!vapidKey) return setState('unconfigured');
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('blocked');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    })().catch(() => setState('unsupported'));
  }, [vapidKey]);

  async function turnOn() {
    setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState('blocked');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(vapidKey) });
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub) });
      if (!r.ok) throw new Error((await r.json()).error || 'Could not save this device');
      setState('on');
      setMsg('Alerts are on for this device.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not turn on alerts.');
    }
  }

  async function test() {
    setMsg('');
    const r = await fetch('/api/push/test', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Test sent to ${j.sent} device${j.sent === 1 ? '' : 's'}.` : j.error || 'Test failed.');
  }

  const copy: Record<State, string> = {
    checking: 'Checking this device…',
    unsupported: 'This browser can’t receive alerts. On iPhone, add Inospot to your Home Screen first, then open it from there.',
    off: 'Alerts are off on this device.',
    on: 'Alerts are on for this device.',
    blocked: 'Notifications are blocked for Inospot. Allow them in your browser or phone settings, then come back.',
    unconfigured: 'Alerts aren’t set up on the server yet. Add the VAPID keys in Render to switch them on.',
  };

  return (
    <div className="callout">
      <p style={{ fontWeight: 650 }}>{copy[state]}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {state === 'off' && <button className="btn" onClick={turnOn}>Turn on alerts</button>}
        {state === 'on' && <button className="btn secondary" onClick={test}>Send a test alert</button>}
      </div>
      {msg && <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>{msg}</p>}
    </div>
  );
}
