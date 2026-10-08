/**
 * Match-day refresh for the draws and live pages.
 *
 * The page is already rendered from the committed snapshot; this re-fetches the sheet's
 * feed and re-renders every `[data-dr-view]` container with the same engine and
 * renderer the build used. It only runs when a feed URL is set on `[data-draws-feed]`,
 * and only while the tab is visible — nobody needs a backgrounded tab polling Google.
 *
 * Failures are silent by design: the last good render stays up.
 */
import { formatUpdated, resolveEvent, type DrawsData } from '../data/draws-engine';
import { renderBracket, renderGroups, renderLive } from '../data/draws-render';

const INTERVAL_MS = 45_000;

const root = document.querySelector<HTMLElement>('[data-draws-feed]');
const feed = root?.dataset.drawsFeed ?? '';

function apply(data: DrawsData): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-dr-view]')) {
    const id = el.dataset.drEvent ?? '';
    const event = data.events[id];
    if (!event) continue;
    const view = resolveEvent(event);
    switch (el.dataset.drView) {
      case 'groups':
        el.innerHTML = renderGroups(view, id);
        break;
      case 'bracket':
        el.innerHTML = renderBracket(view);
        break;
      case 'live':
        el.innerHTML = renderLive(view, el.dataset.drLabel ?? id, el.dataset.drHref ?? '/tournament/draws/');
        break;
    }
  }
  const stamp = formatUpdated(data.updatedAt);
  for (const el of document.querySelectorAll<HTMLElement>('[data-dr-updated]')) {
    el.textContent = stamp;
    el.hidden = !stamp;
  }
}

async function refresh(): Promise<void> {
  try {
    const url = `${feed}${feed.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Feed responded ${res.status}`);
    apply((await res.json()) as DrawsData);
    root?.setAttribute('data-dr-state', 'live');
  } catch (err) {
    root?.setAttribute('data-dr-state', 'stale');
    console.warn('Draws feed unavailable, showing the last known scores.', err);
  }
}

if (root && feed) {
  let timer: number | undefined;
  const start = () => {
    stop();
    void refresh();
    timer = window.setInterval(refresh, INTERVAL_MS);
  };
  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if (!document.hidden) start();
}
