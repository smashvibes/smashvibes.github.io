/**
 * StarRise Cup 2026 — the draws sheet.
 *
 * A Google Sheet is the match desk's admin panel, and the website shows exactly what is
 * typed in it. The website computes NOTHING: the desk decides who plays whom, referees
 * decide results and fill in the knockout. Whoever can edit the sheet is the admin;
 * nobody else can change anything, and the website only ever reads.
 *
 * THE TABS
 *
 *   Read Me        how to use the sheet, for the desk
 *   Entries        a roster for the desk's own reference (event, group, seat, name).
 *                  The website does NOT read it; nothing typed here reaches the site.
 *   U17 Singles    one row per match of that event, in playing order: the 24 group
 *   U17 Doubles    matches (Group A M1–M6, Group B …), then QF 1–4, SF 1–2 and the
 *   Open Doubles   Final. Columns: Stage, Match, Court, Time, Player A, Player B,
 *                  Score, Status. Player A and Player B are plain text the desk types
 *                  on every row: group rows start empty, knockout rows say "1st Group A"
 *                  until the desk types the name over it.
 *
 * RUN THESE (the others are internal helpers):
 *
 *   createDrawsSheet()    once: builds a NEW spreadsheet with every tab pre-filled
 *   seedOrganiserDraw()   writes the organiser's draw of 5 Nov 2026 (DRAW below) onto
 *                         the event tabs: group letters, match numbers, names, courts
 *                         and start times. Keeps scores and statuses. Run once, before
 *                         match day; after that the desk edits the tabs directly.
 *   unlinkPlayers()       once, on a sheet built before 10 Nov 2026: turns the group
 *                         rows' lookup formulas into the names they show, so the desk
 *                         can type over them. Keeps every score, status and time.
 *                         seedOrganiserDraw() does this too, so run one or the other.
 *   upgradeDrawsSheet()   REBUILDS the match tabs from scratch (loses what was typed on
 *                         them); only for a sheet whose tabs are in an older layout
 *   previewFeed()         logs the JSON the website receives — run it after editing
 *   resetScores()         clears scores and statuses; keeps names, courts and times
 *
 * doGet() is the web app: it returns the sheet as JSON. The site fetches it at build
 * time (npm run draws:pull) and again in the browser on match day.
 *
 * SET UP (once)
 *   1. Go to https://script.google.com, press "New project", paste this whole file over
 *      Code.gs and save.
 *   2. Pick createDrawsSheet() in the dropdown next to Run, press Run, approve the
 *      permissions prompt (Google warns the app is unverified — expected for your own
 *      script: Advanced → Go to <project> → Allow).
 *   3. The Execution log prints the sheet's URL and ID. Paste the ID into SHEET_ID
 *      below and save.
 *   4. Deploy → New deployment → type "Web app". Execute as: Me. Who has access:
 *      Anyone. Deploy. Copy the Web app URL (it ends in /exec).
 *   5. In the website repo, paste that URL into src/data/draws-feed.json, run
 *      `npm run draws:pull`, commit. Open the URL in a browser to see the JSON.
 *   6. Share the sheet with the match desk as Editor. That is the whole access list.
 *
 * After changing this file: paste it over the project again, then Deploy → Manage
 * deployments → pencil → Version: New → Deploy. The URL does not change. If the
 * change touched the tabs or columns, run upgradeDrawsSheet() as well.
 *
 * The structure below (EVENTS, MATCHES_PER_GROUP, KNOCKOUT) MUST agree with
 * scripts/pull-draws.mjs in the website repo. Apps Script cannot import that file.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** The sheet createDrawsSheet() made. Empty until step 3 above. */
var SHEET_ID = '';

var SHEET_NAME = 'StarRise Cup 2026 — Draws';
var TIMEZONE = 'Asia/Singapore';
/** How long doGet() may serve the same JSON. Keeps a busy match day from hammering the sheet. */
var CACHE_SECONDS = 20;

var TAB = { readme: 'Read Me', entries: 'Entries' };
/** Tabs an older version of this file made; upgradeDrawsSheet() removes them. */
var OLD_TABS = ['Group Matches', 'Knockout', 'Formats'];

// ---------------------------------------------------------------------------
// Structure. Keep in step with scripts/pull-draws.mjs. Follows the organiser's
// "Round Robin & KO Round & Overall Schedule (5 Nov 26) v5": groups are lettered A–L
// across the three events, matches are numbered 1–72 across the day, and the knockout
// pairs each group winner with another group's runner-up.
// ---------------------------------------------------------------------------

var SEATS = 4;
/** Rows pre-made per group: a group of four plays six matches. The desk types who plays in each. */
var MATCHES_PER_GROUP = 6;

/**
 * The knockout, as the organiser drew it. A side is [place, group index]: "W" is the
 * group winner, "R" the runner-up, and the index points into the event's four groups.
 * The website shows the resulting text ("Winner Gp A") until the desk types a name over it.
 */
var KNOCKOUT = [
  { id: 'QF1', label: 'QF 1', a: ['W', 0], b: ['R', 3] },
  { id: 'QF2', label: 'QF 2', a: ['R', 1], b: ['W', 2] },
  { id: 'QF3', label: 'QF 3', a: ['W', 1], b: ['R', 0] },
  { id: 'QF4', label: 'QF 4', a: ['R', 2], b: ['W', 3] },
  { id: 'SF1', label: 'SF 1', a: 'Winner QF 1', b: 'Winner QF 2' },
  { id: 'SF2', label: 'SF 2', a: 'Winner QF 3', b: 'Winner QF 4' },
  { id: 'F', label: 'Final', a: 'Winner SF 1', b: 'Winner SF 2' },
];

/**
 * Per event: its four groups (first group on court 1, second on court 2, …), the number
 * of its first match, when its first round starts (the organiser lists the rest as
 * "follow by", so later rows are left for the desk), and the knockout's court and time.
 */
var EVENTS = [
  {
    id: 'u17-singles',
    label: 'U17 Singles',
    groups: ['A', 'B', 'C', 'D'],
    firstMatch: 1,
    groupStart: '10:15 AM',
    knockout: {
      QF1: ['2:15 PM', 1], QF2: ['2:15 PM', 2], QF3: ['2:15 PM', 3], QF4: ['2:15 PM', 4],
      SF1: ['3:15 PM', 1], SF2: ['3:15 PM', 2], F: ['4:30 PM', 1],
    },
  },
  {
    id: 'u17-doubles',
    label: 'U17 Doubles',
    groups: ['E', 'F', 'G', 'H'],
    firstMatch: 25,
    groupStart: '11:30 AM',
    knockout: {
      QF1: ['2:30 PM', 1], QF2: ['2:30 PM', 2], QF3: ['2:30 PM', 3], QF4: ['2:30 PM', 4],
      SF1: ['3:15 PM', 3], SF2: ['3:15 PM', 4], F: ['4:30 PM', 2],
    },
  },
  {
    id: 'open-doubles',
    label: 'Open Doubles',
    groups: ['I', 'J', 'K', 'L'],
    firstMatch: 49,
    groupStart: '1:00 PM',
    knockout: {
      QF1: ['2:45 PM', 1], QF2: ['2:45 PM', 2], QF3: ['2:45 PM', 3], QF4: ['2:45 PM', 4],
      SF1: ['3:45 PM', 1], SF2: ['3:45 PM', 2], F: ['4:30 PM', 3],
    },
  },
];

/**
 * The organiser's draw of 5 Nov 2026, for seedOrganiserDraw(): each group's four names
 * in the order the organiser's sheet lists them. Names are copied from the per-group
 * "Fixtures & Results" pages, with two stray brackets removed ("Lai Yu Le ((EBC)",
 * "Eli Navarette & Chan Kok Fung ((DBC)"). The desk can edit any of them on the tab.
 */
var DRAW = {
  'u17-singles': {
    A: ['Shawn Goh Shao Yu (GSS)', 'Jaden Mak Jian En (A-Forze)', 'Chen Ruoyun (CCH)', 'Clara Yap (Meow)'],
    B: ['James Chooi (Meow)', 'Kecia Lui (RGS)', 'Kiran Fan Jingyun (A-Forze)', 'Joash Gomez (TTBC)'],
    C: ['Liu Zhiyuan (OTC)', 'Jorel Tay Jiale (DSTS)', 'Sim Yen Theng (NGZY)', 'Joshua Lum Kai Ze (CSC)'],
    D: ['Lai Yu Le (EBC)', 'Jarius Yeo Wen Jun (SES)', 'Ethan Tum Ze Mun (NGZY)', 'Bryan Chng Heng Rui (DSTS)'],
  },
  'u17-doubles': {
    E: ['Vincy Ng & Elica Chen (DBC)', 'Annabel Chua & Gu Manling', 'Yong Bok Yu & Yau Wen Jie (DAS)', 'Lee Shin Hanc & Lucas Tan (AZE)'],
    F: ['Eli Navarette & Chan Kok Fung (DBC)', 'Chew Ting Rui & Dylan Tan (A-Forze)', 'Thomas Teh & Kevin Lim (GDS)', 'Bai Weizhe & Lucas Chen (USA)'],
    G: ['Xann Yap & Dionne Teo (AH)', 'Kate Neo & Angeline Lim', 'Adalia Teo & Sarah Chng (DSTS)', 'Chong Wei Jun & Ng Zhan Feng (ES)'],
    H: ['Nathaniel Wong & Gabriel X Tan (AH)', 'Travis Voo & Nathan Tan (DSTS)', 'Kanghyun Kim & Tsai Hsin An (UWCD)', 'Lucas Wong & Gabriel Ho (DH)'],
  },
  'open-doubles': {
    I: ['James Ong & Lim Boon Chai', 'Ann Lin & Seh Wei Ching', 'Chua Chye Khoon & Kok Dong Yuan', 'Lim Horng Huei & Hoong Jia Qi'],
    J: ['Jordan Oh & Isabel Yeow', 'Dickson Mah & Justin Chew', 'Sebastian Eio & Marcus Chan', 'Teo Xue Pang & Goh Zi Feng'],
    K: ['Ella Lo Rui Yi & Lionel Boey', 'Jaren Ong & Talia', 'Tan Shinn Tatt & Looi Yi An', 'Mark Wong Wizhe & Lim Wen Kai'],
    L: ['Bon Joey DB & Renee Tang', 'Darion Teo & Gareth Soh', 'Sng Wai Chin & Sng Wai Choung', 'Perry Tan & Low Wei Chie'],
  },
};
/** The order the organiser's sheet plays a group of four in, by roster position (1-based). */
var DRAW_ORDER = [[1, 2], [3, 4], [1, 3], [2, 4], [1, 4], [2, 3]];

var ENTRIES_HEADERS = ['Event', 'Group', 'Seat', 'Name'];
/** Columns an older version of this file added to Entries; upgradeDrawsSheet() removes them. */
var OLD_ENTRIES_COLUMNS = ['Pos', 'Played', 'Won', 'Lost', '+/-', 'Qualified'];
var MATCH_HEADERS = ['Stage', 'Match', 'Court', 'Time', 'Player A', 'Player B', 'Score', 'Status'];
/** Column numbers on an event tab, 1-based. */
var COL = { stage: 1, match: 2, court: 3, time: 4, a: 5, b: 6, score: 7, status: 8 };
var PLAYER_NOTE = 'Type the player or pair names. Who plays whom, and in what order, is up to the desk; the website shows exactly what is typed here.';

// ---------------------------------------------------------------------------
// ENTRY POINT: build the sheet
// ---------------------------------------------------------------------------

function createDrawsSheet() {
  var ss = SpreadsheetApp.create(SHEET_NAME);
  ss.setSpreadsheetTimeZone(TIMEZONE);
  var placeholder = ss.getSheets()[0];

  buildReadme_(ss);
  buildEntries_(ss);
  EVENTS.forEach(function (e) { buildEventTab_(ss, e); });
  ss.deleteSheet(placeholder);

  Logger.log('Created: ' + ss.getUrl());
  Logger.log('SHEET_ID = \'' + ss.getId() + '\'   <- paste into this script, then deploy as a web app');
}

/**
 * One-off for a sheet built before 10 Nov 2026, when group rows took their players from
 * Entries by formula. Replaces each formula with the name it currently shows, lifts the
 * grey "this is a formula" protection off Player A / Player B, and leaves everything
 * else (scores, statuses, courts, times, knockout names) exactly as typed. Also refreshes
 * Read Me. Safe to re-run: a second run finds no formulas and changes nothing.
 */
function unlinkPlayers() {
  var ss = open_();
  var changes = [];
  EVENTS.forEach(function (e) {
    var sh = ss.getSheetByName(e.label);
    if (!sh) { changes.push(e.label + ': no tab, skipped'); return; }
    changes.push(e.label + ': ' + unlinkTab_(sh) + ' formulas replaced with the names they showed');
  });
  refreshReadme_(ss);
  changes.push('Read Me refreshed');
  CacheService.getScriptCache().remove('feed');
  Logger.log(changes.join('\n'));
}

/**
 * Writes the organiser's draw (DRAW, EVENTS, KNOCKOUT) onto each event tab: Stage,
 * Match, Court, Time, Player A and Player B on every row, in the organiser's order.
 * Score and Status are left exactly as they are, so it is safe before match day and
 * harmless on an already-seeded sheet. Rows beyond the 31 it writes are left alone and
 * reported. Also unlinks any old lookup formulas and refreshes Read Me.
 */
function seedOrganiserDraw() {
  var ss = open_();
  var changes = [];
  EVENTS.forEach(function (e) {
    var sh = ss.getSheetByName(e.label);
    if (!sh) { buildEventTab_(ss, e); sh = ss.getSheetByName(e.label); changes.push(e.label + ': tab created'); }
    unlinkTab_(sh);
    var rows = seedRows_(e);
    var n = rows.length;
    var have = sh.getLastRow() - 1;
    sh.getRange(2, COL.stage, n, COL.b).setValues(rows);
    sh.getRange(2, COL.time, n, 1).setNumberFormat('h:mm am/pm');
    sh.getRange(2, COL.a, n, 2).setNumberFormat('@');
    var firstKnockoutRow = e.groups.length * MATCHES_PER_GROUP + 2;
    sh.getRange(firstKnockoutRow, 1, 1, MATCH_HEADERS.length).setBorder(true, null, null, null, null, null, '#b08a2e', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    changes.push(e.label + ': ' + n + ' rows written' + (have > n ? ' (' + (have - n) + ' extra rows below them left untouched)' : ''));
  });
  refreshReadme_(ss);
  changes.push('Read Me refreshed');
  CacheService.getScriptCache().remove('feed');
  Logger.log(changes.join('\n'));
}

/** Stage, Match, Court, Time, Player A, Player B for every row of an event, from DRAW. */
function seedRows_(e) {
  var names = DRAW[e.id] || {};
  var rows = [];
  e.groups.forEach(function (g, gi) {
    var roster = names[g] || ['', '', '', ''];
    DRAW_ORDER.forEach(function (pair, i) {
      rows.push(['Group ' + g, 'M' + matchNo_(e, gi, i), gi + 1, i === 0 ? e.groupStart : '', roster[pair[0] - 1] || '', roster[pair[1] - 1] || '']);
    });
  });
  KNOCKOUT.forEach(function (k) {
    var slot = e.knockout[k.id] || ['', ''];
    var side = knockoutSides_(e, k);
    rows.push([stageOf_(k.id), k.label, slot[1], slot[0], side[0], side[1]]);
  });
  return rows;
}

/** Replaces lookup formulas in Player A / Player B with their values and lifts the grey protection. */
function unlinkTab_(sh) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  var rng = sh.getRange(2, COL.a, n, 2);
  var formulas = rng.getFormulas();
  var names = rng.getDisplayValues();
  var count = 0;
  formulas.forEach(function (row) { row.forEach(function (f) { if (f) count++; }); });
  if (count) rng.setNumberFormat('@').setValues(names);
  rng.setBackground(null);
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) {
    var r = p.getRange();
    if (r.getColumn() === COL.a && r.getLastColumn() === COL.b) p.remove();
  });
  sh.getRange(1, COL.a, 1, 2).setNote(PLAYER_NOTE);
  return count;
}

/**
 * Safe to re-run, but DESTRUCTIVE for the match tabs: rebuilds them in this file's
 * layout, trims Entries back to its four columns, drops tabs older versions made and
 * refreshes Read Me. Names on the Entries tab are kept; anything typed on the OLD match
 * tabs (names, scores, statuses, changed times) is NOT carried over. For a sheet that
 * only needs the lookup formulas gone, run unlinkPlayers() instead.
 */
function upgradeDrawsSheet() {
  var ss = open_();
  var changes = [];

  var entries = ss.getSheetByName(TAB.entries);
  if (!entries) {
    buildEntries_(ss);
    changes.push('Entries: created');
  } else {
    var headers = entries.getRange(1, 1, 1, entries.getLastColumn()).getValues()[0].map(String);
    var extra = headers.length - ENTRIES_HEADERS.length;
    if (extra > 0 && OLD_ENTRIES_COLUMNS.indexOf(headers[ENTRIES_HEADERS.length]) !== -1) {
      entries.deleteColumns(ENTRIES_HEADERS.length + 1, extra);
      changes.push('Entries: removed ' + extra + ' standings columns');
    }
  }

  OLD_TABS.concat(EVENTS.map(function (e) { return e.label; })).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (sh) { ss.deleteSheet(sh); changes.push('Removed tab ' + name); }
  });
  EVENTS.forEach(function (e) { buildEventTab_(ss, e); changes.push('Built tab ' + e.label); });

  refreshReadme_(ss);
  changes.push('Read Me refreshed');

  CacheService.getScriptCache().remove('feed');
  Logger.log(changes.join('\n'));
}

/** Replaces Read Me with this file's text and keeps Read Me and Entries as the first two tabs. */
function refreshReadme_(ss) {
  var readme = ss.getSheetByName(TAB.readme);
  if (readme) ss.deleteSheet(readme);
  buildReadme_(ss);
  ss.setActiveSheet(ss.getSheetByName(TAB.readme));
  ss.moveActiveSheet(1);
  var entries = ss.getSheetByName(TAB.entries);
  if (entries) {
    ss.setActiveSheet(entries);
    ss.moveActiveSheet(2);
  }
}

/** A roster the desk may fill for its own reference. The website never reads this tab. */
function buildEntries_(ss) {
  var rows = [];
  EVENTS.forEach(function (e) {
    e.groups.forEach(function (g) {
      for (var s = 1; s <= SEATS; s++) rows.push([e.label, g, s, '']);
    });
  });
  var sh = newTab_(ss, TAB.entries, ENTRIES_HEADERS, rows);
  sh.setColumnWidth(4, 260);
  lock_(sh, 1, 3, 'Event, group and seat are fixed. Type names in the Name column.');
}

/**
 * One event's matches, top to bottom in playing order. The desk types who plays whom:
 * Player A and Player B are plain text on every row. Group rows start empty; knockout
 * rows start as "1st Group A" and so on until a name is typed over them.
 */
function buildEventTab_(ss, e) {
  var rows = [];
  e.groups.forEach(function (g, gi) {
    for (var i = 0; i < MATCHES_PER_GROUP; i++) {
      rows.push(['Group ' + g, 'M' + matchNo_(e, gi, i), gi + 1, i === 0 ? e.groupStart : '', '', '', '', '']);
    }
  });
  var firstKnockoutRow = rows.length + 2;
  KNOCKOUT.forEach(function (k) {
    var slot = e.knockout[k.id] || ['', ''];
    var side = knockoutSides_(e, k);
    rows.push([stageOf_(k.id), k.label, slot[1], slot[0], side[0], side[1], '', '']);
  });

  var sh = newTab_(ss, e.label, MATCH_HEADERS, rows);
  var n = rows.length;

  sh.getRange(2, COL.time, n, 1).setNumberFormat('h:mm am/pm');
  sh.setColumnWidths(COL.a, 2, 200);
  // Plain text, so a name like "3-4" or a score like "11-8" never turns into a date.
  sh.getRange(2, COL.a, n, 2).setNumberFormat('@');
  sh.getRange(1, COL.a, 1, 2).setNote(PLAYER_NOTE);
  sh.setColumnWidth(COL.score, 170);
  sh.getRange(2, COL.score, n, 1).setNumberFormat('@');
  sh.getRange(2, COL.score, n, 1).setNote('Type the score as "21-15" or, for best of three, "21-15, 18-21, 21-19". Walkovers etc. can be written as words.');
  sh.getRange(2, COL.status, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Live', 'Done'], true).setAllowInvalid(false)
      .setHelpText('Live while the match is on court, Done when it ends. Leave blank before it starts.').build()
  );
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Live').setBackground('#fde9b8')
      .setRanges([sh.getRange(2, COL.status, n, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Done').setBackground('#e3efe3')
      .setRanges([sh.getRange(2, COL.status, n, 1)]).build(),
  ]);

  // A rule between the group stage and the knockout, so the two halves read apart.
  sh.getRange(firstKnockoutRow, 1, 1, MATCH_HEADERS.length).setBorder(true, null, null, null, null, null, '#b08a2e', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  lock_(sh, COL.stage, 2, 'Stage and match are fixed.');
  sh.getRange(firstKnockoutRow, COL.a, KNOCKOUT.length, 2).setNote('The website shows this text as it is. Once the group or match is decided, type the player\'s name over it.');
}

function stageOf_(id) {
  return id === 'F' ? 'Final' : id.indexOf('SF') === 0 ? 'Semi Final' : 'Quarter Final';
}

/** Match numbers run across the day: round 1 of every group first, then round 2, as on the organiser's schedule. */
function matchNo_(e, groupIndex, round) {
  return e.firstMatch + round * e.groups.length + groupIndex;
}

/** The two sides of a knockout row as text: "Winner Gp A", "Runner-up Gp D", "Winner QF 1". */
function knockoutSides_(e, k) {
  var side = function (v) {
    if (typeof v === 'string') return v;
    return (v[0] === 'W' ? 'Winner Gp ' : 'Runner-up Gp ') + e.groups[v[1]];
  };
  return [side(k.a), side(k.b)];
}

function buildReadme_(ss) {
  var lines = [
    [SHEET_NAME],
    [''],
    ['This sheet is the website. What is typed here appears on smashvibes.sg/tournament/draws/ and /tournament/live/ within about a minute.'],
    ['The website works nothing out. Whatever is typed here is what visitors see, so the match desk keeps everything up to date.'],
    [''],
    ['Before the event'],
    ['  1. Each event tab (U17 Singles, U17 Doubles, Open Doubles): type the two names, or pair names, in Player A and Player B for every group match. Who plays whom, and in what order, is yours to decide.'],
    ['  2. On the same tabs, check courts and times. Only the first round of each event has a time; the rest follow on, so leave them blank or type a time once it is known.'],
    ['  3. Entries is a roster for your own reference. The website does not read it, so a name typed there does not appear anywhere until it is typed on an event tab.'],
    [''],
    ['On match day, on the event tab'],
    ['  • Status: set it to Live when a match starts and Done when it ends. The Live page lists matches by this column, so do not skip it.'],
    ['  • Score: type it as 21-15, or 21-15, 18-21, 21-19 for best of three. Player A is the left-hand name. Words like W/O are fine too.'],
    ['  • Knockout rows: once a group is decided, type the player\'s name over "Winner Gp A" and so on. Same for "Winner QF 1" after each match.'],
    [''],
    ['Rules'],
    ['  • Do not rename tabs, add columns in the middle, or change the Stage / Match columns.'],
    ['  • Grey cells are fixed values. Google will warn before you edit them.'],
  ];
  var sh = newTab_(ss, TAB.readme, null, lines);
  sh.setColumnWidth(1, 900);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  lines.forEach(function (l, i) {
    if (/^(Before the event|On match day|Rules)/.test(l[0])) sh.getRange(i + 1, 1).setFontWeight('bold');
  });
}

// --- helpers ---------------------------------------------------------------

function newTab_(ss, name, headers, rows) {
  var sh = ss.insertSheet(name);
  var r = 1;
  if (headers) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f1f1ef');
    sh.setFrozenRows(1);
    r = 2;
  }
  if (rows.length) sh.getRange(r, 1, rows.length, rows[0].length).setValues(rows);
  return sh;
}

/** Warning-only protection: the desk can still edit after a prompt, nobody edits by accident. */
function lock_(sh, col, width, note, rows) {
  var rng = sh.getRange(2, col, Math.max(rows || sh.getLastRow() - 1, 1), width);
  rng.setBackground('#f5f5f3');
  rng.protect().setDescription(note).setWarningOnly(true);
}

// ---------------------------------------------------------------------------
// ENTRY POINT: the feed
// ---------------------------------------------------------------------------

function doGet() {
  var cache = CacheService.getScriptCache();
  var json = cache.get('feed');
  if (!json) {
    json = JSON.stringify(buildFeed_());
    cache.put('feed', json, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function previewFeed() {
  Logger.log(JSON.stringify(buildFeed_(), null, 2));
}

function resetScores() {
  var ss = open_();
  EVENTS.forEach(function (e) {
    var sh = ss.getSheetByName(e.label);
    var n = sh ? sh.getLastRow() - 1 : 0;
    if (n > 0) sh.getRange(2, COL.score, n, 2).clearContent();
  });
  CacheService.getScriptCache().remove('feed');
  Logger.log('Scores and statuses cleared.');
}

function open_() {
  if (!SHEET_ID) throw new Error('Set SHEET_ID first (run createDrawsSheet, copy the ID from the log).');
  return SpreadsheetApp.openById(SHEET_ID);
}

function buildFeed_() {
  var ss = open_();
  var events = {};

  EVENTS.forEach(function (e) {
    var groups = {};
    var event = { groups: [], knockout: [] };
    // Groups come from the Stage column, in the order they first appear on the tab.
    var groupOf = function (name) {
      if (!groups[name]) {
        groups[name] = { name: name, matches: [] };
        event.groups.push(groups[name]);
      }
      return groups[name];
    };

    rows_(ss, e.label).forEach(function (r) {
      var stage = text_(r['Stage']);
      var match = text_(r['Match']);
      var group = /^Group\s+(\S+)$/i.exec(stage);
      var common = {
        court: text_(r['Court']),
        time: time_(r['Time']),
        a: text_(r['Player A']),
        b: text_(r['Player B']),
        score: text_(r['Score']),
        status: text_(r['Status']).toLowerCase(),
      };
      if (group) {
        var g = groupOf(group[1].toUpperCase());
        common.no = Number(match.replace(/^M/i, '')) || g.matches.length + 1;
        g.matches.push(common);
      } else {
        common.id = match.replace(/\s+/g, '').replace(/^Final$/i, 'F').toUpperCase();
        event.knockout.push(common);
      }
    });

    events[e.id] = event;
  });

  return { updatedAt: new Date().toISOString(), events: events };
}

/** A tab as objects keyed by its header row, so column order never matters. */
function rows_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing tab: ' + name);
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(String);
  return values.slice(1)
    .filter(function (row) { return row[0] !== ''; })
    .map(function (row) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = row[i]; });
      return o;
    });
}

function text_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

/** A time cell comes back as a Date (or a day fraction); the site wants "3:00 PM". */
function time_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TIMEZONE, 'h:mm a');
  if (typeof v === 'number') return Utilities.formatDate(new Date(Date.UTC(1899, 11, 30) + v * 86400000), 'UTC', 'h:mm a');
  return text_(v);
}
