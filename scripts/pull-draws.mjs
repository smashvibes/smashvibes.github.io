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
 * fixture order, knockout slots and draft times. Apps Script cannot import this
 * file, so the structure lives in both places; change them together.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SNAPSHOT = resolve(ROOT, 'src/data/draws.json');
const FEED = resolve(ROOT, 'src/data/draws-feed.json');

// ---------------------------------------------------------------------------
// Structure. Keep in step with EVENTS / FIXTURES / KNOCKOUT in draws-sheet.gs.
// ---------------------------------------------------------------------------

const GROUPS = ['A', 'B', 'C', 'D'];
const SEATS = 4;

/** Fixture order within a group of four: nobody plays twice in a row, and the last round decides. */
const FIXTURES = [
  [1, 2],
  [3, 4],
  [1, 3],
  [2, 4],
  [1, 4],
  [2, 3],
];

/**
 * Cross-group quarter finals, so two players from one group cannot meet before the
 * final. The sides are plain text the page shows until the desk types a name over them.
 */
const KNOCKOUT = [
  { id: 'QF1', a: '1st Group A', b: '2nd Group B' },
  { id: 'QF2', a: '1st Group C', b: '2nd Group D' },
  { id: 'QF3', a: '1st Group B', b: '2nd Group A' },
  { id: 'QF4', a: '1st Group D', b: '2nd Group C' },
  { id: 'SF1', a: 'Winner QF 1', b: 'Winner QF 2' },
  { id: 'SF2', a: 'Winner QF 3', b: 'Winner QF 4' },
  { id: 'F', a: 'Winner SF 1', b: 'Winner SF 2' },
];


/**
 * DRAFT timetable on four courts, 15-minute group slots. The U17 Singles group times are
 * the organiser's; everything after is a proposal for the desk to adjust in the sheet.
 * Group A plays on court 1, B on 2, C on 3, D on 4.
 */
const EVENTS = [
  {
    id: 'u17-singles',
    groupTimes: ['10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM'],
    knockout: {
      QF1: ['3:00 PM', '1'], QF2: ['3:00 PM', '2'], QF3: ['3:00 PM', '3'], QF4: ['3:00 PM', '4'],
      SF1: ['3:45 PM', '1'], SF2: ['3:45 PM', '2'], F: ['4:15 PM', '3'],
    },
  },
  {
    id: 'u17-doubles',
    groupTimes: ['12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '1:00 PM', '1:15 PM'],
    knockout: {
      QF1: ['3:15 PM', '1'], QF2: ['3:15 PM', '2'], QF3: ['3:15 PM', '3'], QF4: ['3:15 PM', '4'],
      SF1: ['3:45 PM', '3'], SF2: ['3:45 PM', '4'], F: ['4:15 PM', '4'],
    },
  },
  {
    id: 'open-doubles',
    groupTimes: ['1:30 PM', '1:45 PM', '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM'],
    knockout: {
      QF1: ['3:30 PM', '1'], QF2: ['3:30 PM', '2'], QF3: ['3:30 PM', '3'], QF4: ['3:30 PM', '4'],
      SF1: ['4:15 PM', '1'], SF2: ['4:15 PM', '2'], F: ['4:45 PM', '1'],
    },
  },
];

function template() {
  const events = {};
  for (const e of EVENTS) {
    events[e.id] = {
      groups: GROUPS.map((name, g) => ({
        name,
        players: Array(SEATS).fill(''),
        matches: FIXTURES.map(([a, b], i) => ({
          no: i + 1,
          court: String(g + 1),
          time: e.groupTimes[i] ?? '',
          a,
          b,
          score: '',
          status: '',
        })),
      })),
      knockout: KNOCKOUT.map((k) => {
        const [time = '', court = ''] = e.knockout[k.id] ?? [];
        return { id: k.id, court, time, a: k.a, b: k.b, score: '', status: '' };
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
