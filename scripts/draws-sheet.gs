/**
 * StarRise Cup 2026 — the draws sheet.
 *
 * A Google Sheet is the match desk's admin panel, and the website shows exactly what is
 * typed in it. The website computes NOTHING: referees decide results and fill in the
 * knockout. Whoever can edit the sheet is the admin; nobody else
 * can change anything, and the website only ever reads.
 *
 * THE TABS
 *
 *   Read Me        how to use the sheet, for the desk
 *   Entries        one row per player or pair: event, group, seat, name
 *   U17 Singles    one row per match of that event, in playing order: the 24 group
 *   U17 Doubles    matches (Group A M1–M6, Group B …), then QF 1–4, SF 1–2 and the
 *   Open Doubles   Final. Columns: Stage, Match, Court, Time, Player A, Player B,
 *                  Score, Status. Group rows take their players from Entries; knockout
 *                  rows say "1st Group A" until the desk types the name over it.
 *
 * RUN THESE (the others are internal helpers):
 *
 *   createDrawsSheet()    once: builds a NEW spreadsheet with every tab pre-filled
 *   upgradeDrawsSheet()   rebuilds the match tabs of an existing sheet to this layout,
 *                         keeping the names on Entries, SHEET_ID and the web app URL
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
 * The structure below (EVENTS, GROUPS, FIXTURES, KNOCKOUT) MUST agree with
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
// Structure. Keep in step with scripts/pull-draws.mjs.
// ---------------------------------------------------------------------------

var GROUPS = ['A', 'B', 'C', 'D'];
var SEATS = 4;

/** Fixture order in a group of four: nobody plays twice in a row, and the last round decides. */
var FIXTURES = [
  [1, 2],
  [3, 4],
  [1, 3],
  [2, 4],
  [1, 4],
  [2, 3],
];

/**
 * Cross-group quarter finals, so two players from one group cannot meet before the
 * final. The sides are plain text: the website shows "1st Group A" until the desk types
 * the player's name over it.
 */
var KNOCKOUT = [
  { id: 'QF1', label: 'QF 1', a: '1st Group A', b: '2nd Group B' },
  { id: 'QF2', label: 'QF 2', a: '1st Group C', b: '2nd Group D' },
  { id: 'QF3', label: 'QF 3', a: '1st Group B', b: '2nd Group A' },
  { id: 'QF4', label: 'QF 4', a: '1st Group D', b: '2nd Group C' },
  { id: 'SF1', label: 'SF 1', a: 'Winner QF 1', b: 'Winner QF 2' },
  { id: 'SF2', label: 'SF 2', a: 'Winner QF 3', b: 'Winner QF 4' },
  { id: 'F', label: 'Final', a: 'Winner SF 1', b: 'Winner SF 2' },
];

/**
 * DRAFT timetable on four courts, 15-minute group slots. The U17 Singles group times
 * are the organiser's; everything after is a proposal to adjust in the sheet. Group A
 * plays on court 1, B on 2, C on 3, D on 4.
 */
var EVENTS = [
  {
    id: 'u17-singles',
    label: 'U17 Singles',
    groupTimes: ['10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM'],
    knockout: {
      QF1: ['3:00 PM', 1], QF2: ['3:00 PM', 2], QF3: ['3:00 PM', 3], QF4: ['3:00 PM', 4],
      SF1: ['3:45 PM', 1], SF2: ['3:45 PM', 2], F: ['4:15 PM', 3],
    },
  },
  {
    id: 'u17-doubles',
    label: 'U17 Doubles',
    groupTimes: ['12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '1:00 PM', '1:15 PM'],
    knockout: {
      QF1: ['3:15 PM', 1], QF2: ['3:15 PM', 2], QF3: ['3:15 PM', 3], QF4: ['3:15 PM', 4],
      SF1: ['3:45 PM', 3], SF2: ['3:45 PM', 4], F: ['4:15 PM', 4],
    },
  },
  {
    id: 'open-doubles',
    label: 'Open Doubles',
    groupTimes: ['1:30 PM', '1:45 PM', '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM'],
    knockout: {
      QF1: ['3:30 PM', 1], QF2: ['3:30 PM', 2], QF3: ['3:30 PM', 3], QF4: ['3:30 PM', 4],
      SF1: ['4:15 PM', 1], SF2: ['4:15 PM', 2], F: ['4:45 PM', 1],
    },
  },
];

var ENTRIES_HEADERS = ['Event', 'Group', 'Seat', 'Name'];
/** Columns an older version of this file added to Entries; upgradeDrawsSheet() removes them. */
var OLD_ENTRIES_COLUMNS = ['Pos', 'Played', 'Won', 'Lost', '+/-', 'Qualified'];
var MATCH_HEADERS = ['Stage', 'Match', 'Court', 'Time', 'Player A', 'Player B', 'Score', 'Status'];
/** Column numbers on an event tab, 1-based. */
var COL = { stage: 1, match: 2, court: 3, time: 4, a: 5, b: 6, score: 7, status: 8 };

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
 * Safe to re-run. Rebuilds the match tabs in this file's layout, trims Entries back to
 * its four columns, drops tabs older versions made and refreshes Read Me. Names on the
 * Entries tab are kept; anything typed on the OLD match tabs (scores, statuses, changed
 * times) is NOT carried over.
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

  var readme = ss.getSheetByName(TAB.readme);
  if (readme) ss.deleteSheet(readme);
  buildReadme_(ss);
  ss.setActiveSheet(ss.getSheetByName(TAB.readme));
  ss.moveActiveSheet(1);
  ss.setActiveSheet(ss.getSheetByName(TAB.entries));
  ss.moveActiveSheet(2);
  changes.push('Read Me refreshed');

  CacheService.getScriptCache().remove('feed');
  Logger.log(changes.join('\n'));
}

function buildEntries_(ss) {
  var rows = [];
  EVENTS.forEach(function (e) {
    GROUPS.forEach(function (g) {
      for (var s = 1; s <= SEATS; s++) rows.push([e.label, g, s, '']);
    });
  });
  var sh = newTab_(ss, TAB.entries, ENTRIES_HEADERS, rows);
  sh.setColumnWidth(4, 260);
  lock_(sh, 1, 3, 'Event, group and seat are fixed. Type names in the Name column.');
}

/**
 * One event's matches, top to bottom in playing order. Group rows look their players
 * up on Entries by event, group and seat, so a name typed there appears here at once.
 */
function buildEventTab_(ss, e) {
  var rows = [];
  var lookups = [];
  GROUPS.forEach(function (g, gi) {
    FIXTURES.forEach(function (f, i) {
      lookups.push({ row: rows.length + 2, group: g, a: f[0], b: f[1] });
      rows.push(['Group ' + g, 'M' + (i + 1), gi + 1, e.groupTimes[i] || '', '', '', '', '']);
    });
  });
  var firstKnockoutRow = rows.length + 2;
  KNOCKOUT.forEach(function (k) {
    var slot = e.knockout[k.id] || ['', ''];
    rows.push([stageOf_(k.id), k.label, slot[1], slot[0], k.a, k.b, '', '']);
  });

  var sh = newTab_(ss, e.label, MATCH_HEADERS, rows);
  var n = rows.length;

  var lookup = function (l, seat) {
    return '=IFERROR(FILTER(' + TAB.entries + '!$D$2:$D, ' +
      TAB.entries + '!$A$2:$A="' + e.label + '", ' +
      TAB.entries + '!$B$2:$B="' + l.group + '", ' +
      TAB.entries + '!$C$2:$C=' + seat + '), "")';
  };
  lookups.forEach(function (l) {
    sh.getRange(l.row, COL.a).setFormula(lookup(l, l.a));
    sh.getRange(l.row, COL.b).setFormula(lookup(l, l.b));
  });

  sh.getRange(2, COL.time, n, 1).setNumberFormat('h:mm am/pm');
  sh.setColumnWidths(COL.a, 2, 200);
  sh.setColumnWidth(COL.score, 170);
  // Plain text, or Sheets turns "11-8" into the 8th of November.
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
  lock_(sh, COL.a, 2, 'Group rows take their players from the Entries tab.', lookups.length);
  sh.getRange(firstKnockoutRow, COL.a, KNOCKOUT.length, 2).setNote('The website shows this text as it is. Once the group or match is decided, type the player\'s name over it.');
}

function stageOf_(id) {
  return id === 'F' ? 'Final' : id.indexOf('SF') === 0 ? 'Semi Final' : 'Quarter Final';
}

function buildReadme_(ss) {
  var lines = [
    [SHEET_NAME],
    [''],
    ['This sheet is the website. What is typed here appears on smashvibes.sg/tournament/draws/ and /tournament/live/ within about a minute.'],
    ['The website works nothing out. Whatever is typed here is what visitors see, so the match desk keeps everything up to date.'],
    [''],
    ['Before the event'],
    ['  1. Entries: type each player or pair name next to its group and seat. Seat order within a group does not matter.'],
    ['  2. Each event tab (U17 Singles, U17 Doubles, Open Doubles): check courts and times. Everything after the U17 Singles groups is a draft — change it freely.'],
    [''],
    ['On match day, on the event tab'],
    ['  • Status: set it to Live when a match starts and Done when it ends. The Live page lists matches by this column, so do not skip it.'],
    ['  • Score: type it as 21-15, or 21-15, 18-21, 21-19 for best of three. Player A is the left-hand name. Words like W/O are fine too.'],
    ['  • Knockout rows: once a group is decided, type the player\'s name over "1st Group A" and so on. Same for "Winner QF 1" after each match.'],
    [''],
    ['Rules'],
    ['  • Do not rename tabs, add columns in the middle, or change the Stage / Match / Event / Group / Seat columns.'],
    ['  • Grey cells are formulas or fixed values. Google will warn before you edit them.'],
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
    GROUPS.forEach(function (g) {
      groups[g] = { name: g, players: [], matches: [] };
      for (var s = 0; s < SEATS; s++) groups[g].players.push('');
      event.groups.push(groups[g]);
    });

    rows_(ss, TAB.entries).forEach(function (r) {
      var g = groups[String(r['Group'])];
      var seat = Number(r['Seat']);
      if (r['Event'] !== e.label || !g || !(seat >= 1 && seat <= SEATS)) return;
      g.players[seat - 1] = text_(r['Name']);
    });

    rows_(ss, e.label).forEach(function (r) {
      var stage = text_(r['Stage']);
      var match = text_(r['Match']);
      var group = /^Group (\w)$/.exec(stage);
      if (group && groups[group[1]]) {
        var no = Number(match.replace(/^M/i, ''));
        var seats = FIXTURES[no - 1] || [0, 0];
        groups[group[1]].matches.push({
          no: no,
          court: text_(r['Court']),
          time: time_(r['Time']),
          a: seats[0],
          b: seats[1],
          score: text_(r['Score']),
          status: text_(r['Status']).toLowerCase(),
        });
      } else {
        event.knockout.push({
          id: match.replace(/\s+/g, '').replace(/^Final$/i, 'F').toUpperCase(),
          court: text_(r['Court']),
          time: time_(r['Time']),
          a: text_(r['Player A']),
          b: text_(r['Player B']),
          score: text_(r['Score']),
          status: text_(r['Status']).toLowerCase(),
        });
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
