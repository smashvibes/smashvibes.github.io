/**
 * Refreshes the committed draws snapshot, src/data/draws.json, from the organiser's sheet.
 *
 *   npm run draws:pull         fetch the feed in src/data/draws-feed.json and overwrite the snapshot
 *   npm run draws:template     write the empty structure instead (no sheet needed)
 *
 * The snapshot is what the build renders, so the pages work even if Google is slow, and
 * the browser re-fetches the same feed on match day for live scores. Pull, eyeball the
 * diff, commit: the deploy then carries the latest names and times as static HTML.
 *
 * The template MUST agree with the seed in scripts/draws-sheet.gs — same events, groups,
 * matches per group, knockout slots and draft times. Player names are always typed by
 * the desk, so the template's group matches have empty sides. Apps Script cannot import this
 * file, so the structure lives in both places; change them together.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SNAPSHOT = resolve(ROOT, 'src/data/draws.json');
const FEED = resolve(ROOT, 'src/data/draws-feed.json');

// ---------------------------------------------------------------------------
// Structure. Keep in step with EVENTS / MATCHES_PER_GROUP / KNOCKOUT in draws-sheet.gs.
// Follows the organiser's "Round Robin & KO Round & Overall Schedule (5 Nov 26) v5":
// groups lettered A–L across the three events, matches numbered 1–72 across the day.
// ---------------------------------------------------------------------------

/** Rows per group: a group of four plays six matches. The desk types who plays in each. */
const MATCHES_PER_GROUP = 6;

/**
 * The knockout as the organiser drew it. A side is [place, group index] ("W" winner,
 * "R" runner-up, into the event's four groups) or plain text. The page shows the text
 * until the desk types a name over it.
 */
const KNOCKOUT = [
  { id: 'QF1', a: ['W', 0], b: ['R', 3] },
  { id: 'QF2', a: ['R', 1], b: ['W', 2] },
  { id: 'QF3', a: ['W', 1], b: ['R', 0] },
  { id: 'QF4', a: ['R', 2], b: ['W', 3] },
  { id: 'SF1', a: 'Winner QF 1', b: 'Winner QF 2' },
  { id: 'SF2', a: 'Winner QF 3', b: 'Winner QF 4' },
  { id: 'F', a: 'Winner SF 1', b: 'Winner SF 2' },
];

/**
 * Per event: its four groups (first group on court 1, second on court 2, …), the number
 * of its first match, when its first round starts (later rounds "follow by", so their
 * time is left blank), and the knockout's court and time.
 */
const EVENTS = [
  {
    id: 'u17-singles',
    groups: ['A', 'B', 'C', 'D'],
    firstMatch: 1,
    groupStart: '10:15 AM',
    knockout: {
      QF1: ['2:15 PM', '1'], QF2: ['2:15 PM', '2'], QF3: ['2:15 PM', '3'], QF4: ['2:15 PM', '4'],
      SF1: ['3:15 PM', '1'], SF2: ['3:15 PM', '2'], F: ['4:30 PM', '1'],
    },
  },
  {
    id: 'u17-doubles',
    groups: ['E', 'F', 'G', 'H'],
    firstMatch: 25,
    groupStart: '11:30 AM',
    knockout: {
      QF1: ['2:30 PM', '1'], QF2: ['2:30 PM', '2'], QF3: ['2:30 PM', '3'], QF4: ['2:30 PM', '4'],
      SF1: ['3:15 PM', '3'], SF2: ['3:15 PM', '4'], F: ['4:30 PM', '2'],
    },
  },
  {
    id: 'open-doubles',
    groups: ['I', 'J', 'K', 'L'],
    firstMatch: 49,
    groupStart: '1:00 PM',
    knockout: {
      QF1: ['2:45 PM', '1'], QF2: ['2:45 PM', '2'], QF3: ['2:45 PM', '3'], QF4: ['2:45 PM', '4'],
      SF1: ['3:45 PM', '1'], SF2: ['3:45 PM', '2'], F: ['4:30 PM', '3'],
    },
  },
];

/** "Winner Gp A" / "Runner-up Gp D" for a seeded side, or the text as given. */
function side(e, v) {
  return typeof v === 'string' ? v : `${v[0] === 'W' ? 'Winner Gp ' : 'Runner-up Gp '}${e.groups[v[1]]}`;
}

function template() {
  const events = {};
  for (const e of EVENTS) {
    events[e.id] = {
      groups: e.groups.map((name, g) => ({
        name,
        matches: Array.from({ length: MATCHES_PER_GROUP }, (_, i) => ({
          no: e.firstMatch + i * e.groups.length + g,
          court: String(g + 1),
          time: i === 0 ? e.groupStart : '',
          a: '',
          b: '',
          score: '',
          status: '',
        })),
      })),
      knockout: KNOCKOUT.map((k) => {
        const [time = '', court = ''] = e.knockout[k.id] ?? [];
        return { id: k.id, court, time, a: side(e, k.a), b: side(e, k.b), score: '', status: '' };
      }),
    };
  }
  return { updatedAt: new Date().toISOString(), events };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

function check(data) {
  if (!data || typeof data !== 'object' || typeof data.events !== 'object') {
    throw new Error('Feed did not return a draws object');
  }
  for (const [id, ev] of Object.entries(data.events)) {
    if (!Array.isArray(ev.groups) || !Array.isArray(ev.knockout)) {
      throw new Error(`Event ${id} is missing groups or knockout`);
    }
  }
  return data;
}

async function pull() {
  const { url } = JSON.parse(readFileSync(FEED, 'utf8'));
  if (!url) {
    throw new Error('No feed url in src/data/draws-feed.json — deploy draws-sheet.gs as a web app and paste its /exec URL there');
  }
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Feed responded ${res.status}`);
  return check(await res.json());
}

const data = process.argv.includes('--template') ? template() : await pull();
writeFileSync(SNAPSHOT, `${JSON.stringify(data, null, 2)}\n`);
const n = Object.keys(data.events).length;
console.log(`Wrote ${SNAPSHOT.replace(`${ROOT}/`, '')} — ${n} events, updated ${data.updatedAt}`);
