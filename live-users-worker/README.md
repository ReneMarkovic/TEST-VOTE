# Optional live visitor count

The site is hosted as a static GitHub Pages app, so it cannot maintain a shared, accurate online-presence count by itself. The optional count in the header uses a separate Cloudflare Worker with a Durable Object.

## Setup

1. Install Wrangler and authenticate with Cloudflare (`npm install --global wrangler`, then `wrangler login`).
2. In `live-users-worker/wrangler.toml`, set `ALLOWED_ORIGIN` to the exact public site origin (for example `https://<user>.github.io`).
3. From `live-users-worker/`, deploy with `wrangler deploy` and note the Worker URL.
4. Add a GitHub Actions repository variable named `VITE_LIVE_USERS_ENDPOINT` with the full endpoint URL, ending in `/count` (for example `https://test-vote-live-users.<account>.workers.dev/count`). Vite injects this at build time.
5. Trigger the Pages deployment again. The header displays a count after the first successful heartbeat.

The count represents active browser-tab sessions that sent a heartbeat in the last 90 seconds—not verified people. The browser stores a random, tab-scoped identifier in `sessionStorage`; the Worker stores only that identifier and its last-seen timestamp, and expires inactive entries. No IP address or election-app data is stored. If the endpoint is unset or unavailable, the count is hidden or shown as unavailable and the rest of the site continues to work.
