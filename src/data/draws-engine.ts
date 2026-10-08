/**
 * Draws engine: turns the organiser's sheet (as JSON) into something renderable.
 *
 * Deliberately dumb. The referees work out results, who qualifies and who plays whom;
 * the website shows what they typed and nothing more. So this module only reshapes the
 * feed: it never computes a winner, a table or a seed.
 *
 * Pure TypeScript with no imports, because it runs in two places: at build time, where
 * the pages render the committed snapshot in src/data/draws.json, and in the browser,
 * where the draws and live pages re-fetch the sheet's feed and re-render.
 *
 * The data shape is what scripts/draws-sheet.gs emits from the Google Sheet.
 */

export type Status = 'scheduled' | 'live' | 'done';

export interface GroupMatchData {
  no: number;
  court: string;
  time: string;
  /** Seats in the group, 1-based. */
  a: number;
  b: number;
  /** As typed: "21-15" or "21-15, 18-21, 21-19". Anything else is shown as text. */
  score: string;
  /** "" (not started), "live" or "done" — exactly as the desk set it. */
  status: string;
}

export interface GroupData {
  name: string;
  /** Names by seat, as typed; "" until the draw is made. */
  players: string[];
  matches: GroupMatchData[];
}

export interface KnockoutMatchData {
  /** QF1–QF4, SF1–SF2, F. */
  id: string;
  court: string;
  time: string;
  /** Names as typed. The seed cells are pre-filled with text like "1st Group A". */
  a: string;
  b: string;
  score: string;
  status: string;
}

export interface EventData {
  groups: GroupData[];
  knockout: KnockoutMatchData[];
}

export interface DrawsData {
  /** When the feed produced this; ISO 8601. */
  updatedAt: string;
  events: Record<string, EventData>;
}

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------

export interface SideView {
  name: string | null;
  /** Points per game, when the score parsed. */
  points: number[];
}

export interface MatchView {
  label: string;
  court: string;
  time: string;
  sides: [SideView, SideView];
  /** The score as typed when it was not "a-b" pairs, e.g. "W/O" or "Retired". */
  rawScore: string | null;
  status: Status;
}

export interface GroupView {
  name: string;
  court: string;
  matches: MatchView[];
}

export interface RoundView {
  name: string;
  matches: MatchView[];
}

export interface EventView {
  groups: GroupView[];
  rounds: RoundView[];
}

const ROUND_NAMES: Record<string, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
  SF: 'Semi Finals',
  F: 'Final',
};
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F'];

export function roundOf(id: string): string {
  const m = /^([A-Z]+)\d*$/.exec(id.trim());
  return m ? m[1] : id;
}

export function matchLabel(id: string): string {
  const m = /^([A-Z]+)(\d+)?$/.exec(id.trim());
  if (!m) return id;
  return m[2] ? `${m[1]} ${m[2]}` : ROUND_NAMES[m[1]] ?? m[1];
}

function cleanName(s: unknown): string | null {
  const t = typeof s === 'string' ? s.trim() : '';
  return t ? t : null;
}

function text(s: string | number | undefined | null): string {
  return s === undefined || s === null ? '' : String(s).trim();
}

/** Only what the desk typed: Live, Done, or nothing. */
export function matchStatus(status: string): Status {
  const s = text(status).toLowerCase();
  return s === 'done' || s === 'live' ? s : 'scheduled';
}

/**
 * "21-15, 18-21, 21-19" → points per side per game. Separators between games may be
 * commas, spaces or slashes; between the two sides a hyphen, en dash or colon. Any
 * other text comes back as null and is shown as typed.
 */
export function parseScore(score: string): [number[], number[]] | null {
  const t = text(score);
  if (!t) return [[], []];
  const a: number[] = [];
  const b: number[] = [];
  for (const part of t.split(/[,/\s]+/).filter(Boolean)) {
    const m = /^(\d+)\s*[-–:]\s*(\d+)$/.exec(part);
    if (!m) return null;
    a.push(Number(m[1]));
    b.push(Number(m[2]));
  }
  return [a, b];
}

function sidesOf(
  names: [string | null, string | null],
  score: string,
): { sides: [SideView, SideView]; rawScore: string | null } {
  const parsed = parseScore(score);
  const pts = parsed ?? [[], []];
  return {
    sides: [
      { name: names[0], points: pts[0] },
      { name: names[1], points: pts[1] },
    ],
    rawScore: parsed ? null : text(score),
  };
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

function groupView(group: GroupData): GroupView {
  const matches = group.matches.map((m): MatchView => {
    const name = (seat: number) => cleanName(group.players[seat - 1]);
    return {
      label: `M${m.no}`,
      court: text(m.court),
      time: text(m.time),
      ...sidesOf([name(m.a), name(m.b)], m.score),
      status: matchStatus(m.status),
    };
  });
  return {
    name: group.name,
    court: text(group.matches[0]?.court),
    matches,
  };
}

// ---------------------------------------------------------------------------
// Knockout
// ---------------------------------------------------------------------------

function knockoutView(event: EventData): RoundView[] {
  const views = [...event.knockout]
    .sort((x, y) => ROUND_ORDER.indexOf(roundOf(x.id)) - ROUND_ORDER.indexOf(roundOf(y.id)))
    .map((m) => {
      const id = m.id.trim().toUpperCase();
      const view: MatchView = {
        label: matchLabel(id),
        court: text(m.court),
        time: text(m.time),
        ...sidesOf([cleanName(m.a), cleanName(m.b)], m.score),
        status: matchStatus(m.status),
      };
      return { id, view };
    });

  const rounds: RoundView[] = [];
  for (const key of ROUND_ORDER) {
    const matches = views.filter((v) => roundOf(v.id) === key).map((v) => v.view);
    if (matches.length) rounds.push({ name: ROUND_NAMES[key], matches });
  }
  return rounds;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function resolveEvent(event: EventData): EventView {
  return { groups: event.groups.map(groupView), rounds: knockoutView(event) };
}

/** "12:42 PM" in Singapore time, for the "last updated" line. */
export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Singapore',
  }).format(d);
}
