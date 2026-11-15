import { useEffect, useState } from 'react';

interface LiveCountResponse {
  count?: number;
}

const HEARTBEAT_INTERVAL_MS = 30_000;
const SESSION_KEY = 'test-vote-live-session';

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Browsers that block sessionStorage still get a functioning, short-lived session.
    return crypto.randomUUID();
  }
}

/** Shows active browser-tab sessions when the optional presence endpoint is configured. */
export function LiveUsersCount() {
  const endpoint = import.meta.env.VITE_LIVE_USERS_ENDPOINT?.trim();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    let stopped = false;
    const sessionId = getSessionId();
    const heartbeat = async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = (await response.json()) as LiveCountResponse;
        if (!stopped && typeof data.count === 'number' && Number.isFinite(data.count)) {
          setCount(data.count);
        }
      } catch {
        // Presence is optional; network failures should not affect the election app.
      }
    };

    void heartbeat();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void heartbeat();
    }, HEARTBEAT_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void heartbeat();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [endpoint]);

  if (!endpoint) return null;

  return (
    <span
      className="text-xs text-slate-500 whitespace-nowrap"
      aria-live="polite"
      title="Aktivni zavihki v zadnjih 90 sekundah; ne gre za preverjeno število oseb."
    >
      Trenutno na strani: <span className="font-mono font-semibold text-slate-700">{count ?? '—'}</span>
    </span>
  );
}
