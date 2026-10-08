/**
 * HTML for the draws and live pages, from the engine's view model.
 *
 * Strings rather than .astro components because the same markup has to be produced
 * twice: at build time from the committed snapshot, and again in the browser each time
 * the feed is re-fetched on match day. One renderer means a refresh cannot drift from
 * the page as built. Every piece of text that came from the sheet goes through `esc`.
 */
import type { EventView, MatchView, RoundView, SideView } from './draws-engine';

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATUS_TEXT = { scheduled: '', live: 'Live', done: 'Done' } as const;

/**
 * The state pill. Big enough to read from across a hall: the draws page is shown on a
 * TV on the day, and the pill plus the row tint is how a glance tells live from done.
 * Scheduled matches get an empty span so the grid columns stay put.
 */
function statusPill(m: MatchView, compact = false): string {
  const label = STATUS_TEXT[m.status];
  if (!label) return '<span class="sv-dr-status"></span>';
  // In a fixture row the green tick alone says "done"; the word would crowd the names.
  if (compact && m.status === 'done') return `<span class="sv-dr-status is-done is-compact"><span class="sv-sr-only">${label}</span></span>`;
  return `<span class="sv-dr-status is-${m.status}">${label}</span>`;
}

function timeBox(time: string): string {
  return time
    ? `<span class="sv-dr-time">${esc(time)}</span>`
    : `<span class="sv-dr-time"><span class="sv-sr-only">Time to be confirmed</span></span>`;
}

function matchNo(m: MatchView): string {
  return `<span class="sv-dr-match-no">${esc(m.label)}</span>`;
}

function name(side: SideView): string {
  if (side.name) return `<span class="sv-dr-name">${esc(side.name)}</span>`;
  return `<span class="sv-dr-name is-tbc"><span class="sv-sr-only">To be decided</span></span>`;
}

function scoreBox(side: SideView): string {
  return `<span class="sv-dr-score-box">${side.points.map(String).join(' ')}</span>`;
}

/** Two boxes, one per side — or the typed text when it was not a score, e.g. "W/O". */
function fixtureScore(m: MatchView): string {
  const [a, b] = m.sides;
  if (m.rawScore !== null) return `<span class="sv-dr-score"><span class="sv-dr-score-raw">${esc(m.rawScore)}</span></span>`;
  return `<span class="sv-dr-score" aria-label="Score">${scoreBox(a)}<span class="sv-dr-score-dash" aria-hidden="true">-</span>${scoreBox(b)}</span>`;
}

function sides(m: MatchView): string {
  const raw = m.rawScore !== null;
  const rows = m.sides.map((s) => `<div class="sv-dr-slot">${name(s)}${raw ? '' : scoreBox(s)}</div>`).join('');
  return `<div class="sv-dr-sides">${rows}${raw ? `<div class="sv-dr-score-raw">${esc(m.rawScore)}</div>` : ''}</div>`;
}

function courtNote(court: string): string {
  return court ? `<span class="sv-dr-court">Court ${esc(court)}</span>` : '';
}

// ---------------------------------------------------------------------------
// Round robin
// ---------------------------------------------------------------------------

function fixture(m: MatchView): string {
  const [a, b] = m.sides;
  return `<li class="sv-dr-fixture is-${m.status}">
  ${timeBox(m.time)}
  ${matchNo(m)}
  <span class="sv-dr-vs">${name(a)}<span class="sv-dr-vs-label">vs</span>${name(b)}</span>
  ${fixtureScore(m)}
  ${statusPill(m, true)}
</li>`;
}

export function renderGroups(view: EventView, eventId: string): string {
  const groups = view.groups
    .map((g) => {
      const id = `group-${eventId}-${g.name}`;
      return `<section class="sv-dr-group" aria-labelledby="${esc(id)}">
  <h3 class="sv-dr-group-title" id="${esc(id)}"><span>Group ${esc(g.name)}</span>${courtNote(g.court)}</h3>
  <ol class="sv-dr-fixtures">${g.matches.map(fixture).join('')}</ol>
</section>`;
    })
    .join('');
  return `<div class="sv-dr-groups">${groups}</div>`;
}

// ---------------------------------------------------------------------------
// Knockout bracket
// ---------------------------------------------------------------------------

function bracketMatch(m: MatchView): string {
  return `<div class="sv-dr-match is-${m.status}">
  ${timeBox(m.time)}
  ${matchNo(m)}
  ${sides(m)}
  <div class="sv-dr-match-foot">${statusPill(m)}${courtNote(m.court)}</div>
</div>`;
}

/**
 * ONE css grid shared by every round: `first-round matches` rows plus a header row. A
 * round-N match spans 2^(N-1) rows and centres itself in that span, which puts it exactly
 * level with the midpoint of the two matches feeding it — no measuring, no script. Each
 * round element is `display: contents` so its children land in the shared grid while the
 * markup stays grouped by round (which is what the mobile layout needs).
 */
export function renderBracket(view: EventView): string {
  const rounds: RoundView[] = view.rounds;
  if (!rounds.length) return '';
  const totalRows = rounds[0].matches.length;
  const cols = rounds
    .map((round, i) => {
      const span = totalRows / round.matches.length;
      const last = i === rounds.length - 1;
      const cells = round.matches
        .map(
          (m, k) =>
            `<div class="sv-dr-cell" style="--row:${k * span + 1};--span:${span}">${bracketMatch(m)}</div>`,
        )
        .join('');
      return `<div class="sv-dr-round" style="--col:${i + 1}"${last ? ' data-last' : ''}>
  <h3 class="sv-dr-round-title">${esc(round.name)}</h3>${cells}
</div>`;
    })
    .join('');
  return `<div class="sv-dr-bracket" style="--dr-rows:${totalRows};--dr-cols:${rounds.length}">${cols}</div>`;
}

// ---------------------------------------------------------------------------
// Live board
// ---------------------------------------------------------------------------

interface Flat {
  stage: string;
  m: MatchView;
}

/** Every match of an event in the order the day runs: M1 of every group, M2s, …, then the bracket. */
export function flatten(view: EventView): Flat[] {
  const out: Flat[] = [];
  const depth = Math.max(0, ...view.groups.map((g) => g.matches.length));
  for (let i = 0; i < depth; i++) {
    for (const g of view.groups) {
      const m = g.matches[i];
      if (m) out.push({ stage: `Group ${g.name}`, m });
    }
  }
  for (const r of view.rounds) for (const m of r.matches) out.push({ stage: r.name, m });
  return out;
}

function liveCard(f: Flat): string {
  const m = f.m;
  return `<li class="sv-lv-card is-${m.status}">
  <div class="sv-lv-card-head"><span class="sv-lv-stage">${esc(f.stage)}</span>${matchNo(m)}${courtNote(m.court)}${
    m.time ? `<span class="sv-lv-time">${esc(m.time)}</span>` : ''
  }${statusPill(m)}</div>
  ${sides(m)}
</li>`;
}

function liveColumn(title: string, items: Flat[], empty: string): string {
  const body = items.length
    ? `<ul class="sv-lv-list">${items.map(liveCard).join('')}</ul>`
    : `<p class="sv-lv-empty">${esc(empty)}</p>`;
  return `<div class="sv-lv-col"><h3 class="sv-lv-col-title">${esc(title)}</h3>${body}</div>`;
}

export function renderLive(view: EventView, label: string, drawsHref: string): string {
  const all = flatten(view);
  const live = all.filter((f) => f.m.status === 'live');
  const next = all.filter((f) => f.m.status === 'scheduled').slice(0, 4);
  const done = all.filter((f) => f.m.status === 'done').reverse().slice(0, 4);
  return `<section class="sv-lv-event">
  <h2 class="sv-lv-event-title">${esc(label)}</h2>
  <div class="sv-lv-cols">
    ${liveColumn('On court now', live, 'No match in progress.')}
    ${liveColumn('Up next', next, 'Nothing scheduled.')}
    ${liveColumn('Latest results', done, 'No results yet.')}
  </div>
  <p class="sv-lv-more"><a href="${esc(drawsHref)}">Full groups and bracket</a></p>
</section>`;
}
