/**
 * The draws as the build sees them: the committed snapshot plus the feed it came from.
 *
 * src/data/draws.json is written by `npm run draws:pull` from the organiser's Google
 * Sheet (scripts/draws-sheet.gs). The pages render it at build time; on match day the
 * browser re-fetches DRAWS_FEED_URL and re-renders with the same engine, so what the
 * build ships is the fallback and the feed is the live truth.
 */
import snapshot from './draws.json';
import feed from './draws-feed.json';
import { resolveEvent, type DrawsData, type EventView } from './draws-engine';

/** The Apps Script web app URL (ends in /exec). Empty until the sheet is deployed; the pages then just show the snapshot. */
export const DRAWS_FEED_URL: string = feed.url;

export const drawsData = snapshot as DrawsData;

export function eventView(id: string): EventView | null {
  const event = drawsData.events[id];
  return event ? resolveEvent(event) : null;
}
