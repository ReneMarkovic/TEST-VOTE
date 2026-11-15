const ACTIVE_WINDOW_MS = 90_000;
const SESSION_ID_PATTERN = /^[0-9a-f-]{36}$/i;

function corsHeaders(origin, allowedOrigin) {
  const permitted = allowedOrigin === '*' || origin === allowedOrigin ? origin : allowedOrigin;
  return {
    'Access-Control-Allow-Origin': permitted || 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN || '*');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname !== '/count' || !['GET', 'POST'].includes(request.method)) {
      return new Response('Not found', { status: 404, headers });
    }

    // One Durable Object provides a shared count across all site visitors.
    const id = env.LIVE_USERS.idFromName('global-live-users');
    const stub = env.LIVE_USERS.get(id);
    const response = await stub.fetch(new Request('https://counter.internal/count', {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? request.body : undefined,
    }));
    return new Response(response.body, {
      status: response.status,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
    });
  },
};

export class LiveUsersCounter {
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.sessions = (await this.state.storage.get('sessions')) || {};
    });
  }

  async fetch(request) {
    const now = Date.now();
    for (const [sessionId, lastSeen] of Object.entries(this.sessions)) {
      if (!Number.isFinite(lastSeen) || now - lastSeen > ACTIVE_WINDOW_MS) {
        delete this.sessions[sessionId];
      }
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      if (typeof body?.sessionId !== 'string' || !SESSION_ID_PATTERN.test(body.sessionId)) {
        return Response.json({ error: 'Invalid session ID' }, { status: 400 });
      }
      this.sessions[body.sessionId] = now;
    }

    await this.state.storage.put('sessions', this.sessions);
    return Response.json({ count: Object.keys(this.sessions).length });
  }
}
