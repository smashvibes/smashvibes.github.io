/**
 * StarRise Cup 2026 — builds the registration Google Form and its response sheet.
 *
 * HOW TO RUN
 *   1. Go to https://script.google.com and press "New project".
 *   2. Select everything in the Code.gs editor and paste this whole file over it.
 *   3. Save (Ctrl/Cmd+S), then pick `createRegistrationForm` in the function dropdown
 *      next to Run, and press Run.
 *   4. Approve the permissions prompt. Google will warn that the app is unverified —
 *      that is expected for your own script: click "Advanced", then
 *      "Go to <project name> (unsafe)", then "Allow".
 *   5. The Execution log at the bottom prints three URLs. The one marked
 *      "FORM (share this one)" is the link to give entrants.
 *   6. Put that URL into REGISTRATION_FORM_URL in src/data/tournament.ts.
 *
 * Re-running creates a SECOND form. To change an existing form, edit it in the Forms UI
 * or open it by id with FormApp.openById().
 */

// ---------------------------------------------------------------------------
// Event constants. Change these before running.
// ---------------------------------------------------------------------------

var EVENT = {
  name: 'StarRise Cup 2026',
  date: '14 November 2026 (Saturday)',
  time: '10:00 AM – 3:00 PM',
  venue: 'SBH VIP Hall @ Sims, 1 Lorong 23 Geylang, Singapore 388352',
  // Under-17 eligibility is judged on the day of play. Born on or after this date = eligible.
  // CONFIRM THIS WITH THE ORGANISER — "under 17" as at the event date vs. as at 1 Jan is
  // the single most common source of eligibility disputes.
  u17CutoffText: 'born on or after 15 November 2009 (i.e. under 17 on the event date)',
  contact: 'WhatsApp 9683 4290',
};

/** Entry caps from the tournament page. Used by updateCategoryAvailability(). */
var CATEGORIES = [
  { key: 'U17_SINGLES', label: 'Under-17 Singles', cap: 16, unit: 'entries' },
  { key: 'U17_DOUBLES', label: 'Under-17 Doubles', cap: 16, unit: 'pairs' },
  { key: 'ADULT_MD', label: "Adults — Men's Doubles", cap: 5, unit: 'pairs' },
  { key: 'ADULT_XD', label: 'Adults — Mixed Doubles', cap: 5, unit: 'pairs' },
];

var CATEGORY_QUESTION = 'Which category are you entering?';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function createRegistrationForm() {
  var form = FormApp.create(EVENT.name + ' — Player Registration');

  form.setDescription(
    EVENT.name + '\n' +
    EVENT.date + ', ' + EVENT.time + '\n' +
    EVENT.venue + '\n\n' +
    'One submission per entry. Doubles pairs submit ONCE, with both players listed.\n' +
    'Questions: ' + EVENT.contact
  );

  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setPublishingSummary(false);

  // Workspace accounts (anything on a custom domain) default a new form to "only people
  // in your organisation can respond" — outside entrants would hit a permission wall and
  // you would never see the failed attempt. Consumer @gmail.com accounts have no such
  // setting and throw here, which is why it is guarded rather than assumed.
  try {
    form.setRequireLogin(false);
  } catch (err) {
    Logger.log('setRequireLogin skipped (consumer account): ' + err.message);
  }
  // Left off so entrants do not need a Google account. Turn on to get verified emails
  // and automatic response receipts, at the cost of forcing sign-in:
  //   form.setCollectEmail(true);
  form.setCollectEmail(false);
  form.setConfirmationMessage(
    'Thanks — your entry is in. We will confirm your slot by WhatsApp before the event. ' +
    'If your plans change, tell us early so the slot can go to another player.'
  );

  // --- Page 1: category ---------------------------------------------------
  var categoryItem = form.addMultipleChoiceItem()
    .setTitle(CATEGORY_QUESTION)
    .setHelpText(
      'Under-17: ' + EVENT.u17CutoffText + '.\n' +
      'Adults: open to social and recreational players. National- and state-level players ' +
      'are not eligible.'
    )
    .setRequired(true);

  // --- The three entry pages ----------------------------------------------
  var singlesPage = form.addPageBreakItem()
    .setTitle('Under-17 Singles — player details');
  addPlayerBlock(form, 'Player', true);
  addGuardianBlock(form);
  addTeenDeclarations(form);
  singlesPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var u17DoublesPage = form.addPageBreakItem()
    .setTitle('Under-17 Doubles — pair details')
    .setHelpText('Submit once per pair. Both players must meet the age cut-off.');
  addPlayerBlock(form, 'Player 1', true);
  addPlayerBlock(form, 'Player 2 (partner)', false);
  addGuardianBlock(form);
  addTeenDeclarations(form);
  u17DoublesPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var adultPage = form.addPageBreakItem()
    .setTitle('Adults Doubles — pair details')
    .setHelpText('Submit once per pair. Mixed Doubles pairs must be one man and one woman.');
  addPlayerBlock(form, 'Player 1', true);
  addPlayerBlock(form, 'Player 2 (partner)', false);
  addEmergencyBlock(form);
  addAdultDeclarations(form);
  adultPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  // Wire the branching now that the target pages exist.
  categoryItem.setChoices([
    categoryItem.createChoice(CATEGORIES[0].label, singlesPage),
    categoryItem.createChoice(CATEGORIES[1].label, u17DoublesPage),
    categoryItem.createChoice(CATEGORIES[2].label, adultPage),
    categoryItem.createChoice(CATEGORIES[3].label, adultPage),
  ]);

  // --- Response sheet ------------------------------------------------------
  var sheet = SpreadsheetApp.create(EVENT.name + ' — Registrations');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('FORM (share this one): ' + form.getPublishedUrl());
  Logger.log('FORM (edit):           ' + form.getEditUrl());
  Logger.log('RESPONSES:             ' + sheet.getUrl());
  return form.getPublishedUrl();
}

/**
 * One player's details. `primary` marks the person we correspond with — only they are
 * asked for an email, so a partner is not forced to hand one over.
 *
 * Deliberately NOT collected: NRIC / passport number. Date of birth already establishes
 * age eligibility, and a photo ID can be checked at the desk without recording the
 * number. Singapore's PDPA rules on NRIC collection are strict, and a Google Sheet is
 * the wrong place to hold them.
 */
function addPlayerBlock(form, who, primary) {
  form.addSectionHeaderItem().setTitle(who);

  form.addTextItem()
    .setTitle(who + ' — full name')
    .setHelpText('Exactly as printed on the NRIC or passport you will bring on the day.')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(who + ' — gender')
    .setChoiceValues(['Male', 'Female'])
    .setRequired(true);

  form.addDateItem()
    .setTitle(who + ' — date of birth')
    .setHelpText('Used only to confirm age eligibility.')
    .setIncludesYear(true)
    .setRequired(true);

  form.addTextItem()
    .setTitle(who + ' — mobile number')
    .setHelpText('WhatsApp preferred. Include the country code if not a Singapore number.')
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Enter 8–15 digits. + and spaces are fine.')
        .requireTextMatchesPattern('^\\+?[0-9 ]{8,17}$')
        .build()
    )
    .setRequired(true);

  if (primary) {
    form.addTextItem()
      .setTitle(who + ' — email')
      .setHelpText('Where the draw and schedule will be sent.')
      .setValidation(FormApp.createTextValidation().requireTextIsEmail().build())
      .setRequired(true);
  }

  form.addTextItem()
    .setTitle(who + ' — school or club')
    .setHelpText('Used to keep players from the same school or club apart in round one. ' +
                 'Enter "None" if you do not belong to one.')
    .setRequired(true);
}

/** Parent or guardian — required for every under-17 entry. */
function addGuardianBlock(form) {
  form.addSectionHeaderItem()
    .setTitle('Parent or guardian')
    .setHelpText('Required for all under-17 entries. Also used as the emergency contact.');

  form.addTextItem().setTitle('Parent / guardian — full name').setRequired(true);
  form.addTextItem()
    .setTitle('Parent / guardian — mobile number')
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Enter 8–15 digits. + and spaces are fine.')
        .requireTextMatchesPattern('^\\+?[0-9 ]{8,17}$')
        .build()
    )
    .setRequired(true);
  form.addTextItem()
    .setTitle('Parent / guardian — relationship to player')
    .setHelpText('e.g. Mother, Father, Legal guardian')
    .setRequired(true);
}

/** Emergency contact — adults. Must be someone not playing in the pair. */
function addEmergencyBlock(form) {
  form.addSectionHeaderItem()
    .setTitle('Emergency contact')
    .setHelpText('Someone who is NOT playing in this pair.');

  form.addTextItem().setTitle('Emergency contact — full name').setRequired(true);
  form.addTextItem()
    .setTitle('Emergency contact — mobile number')
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Enter 8–15 digits. + and spaces are fine.')
        .requireTextMatchesPattern('^\\+?[0-9 ]{8,17}$')
        .build()
    )
    .setRequired(true);
  form.addTextItem()
    .setTitle('Emergency contact — relationship to player')
    .setRequired(true);
}

function addTeenDeclarations(form) {
  form.addSectionHeaderItem().setTitle('Declarations');

  form.addCheckboxItem()
    .setTitle('Eligibility')
    .setChoiceValues([
      'I confirm every player listed is ' + EVENT.u17CutoffText + '.',
      'I confirm no player listed is a current Junior National player, or represents any ' +
        'country in any form.',
    ])
    .setRequired(true);

  addSharedDeclarations(form, true);
}

function addAdultDeclarations(form) {
  form.addSectionHeaderItem().setTitle('Declarations');

  form.addCheckboxItem()
    .setTitle('Eligibility')
    .setChoiceValues([
      'I confirm neither player is a national-level or state-level player.',
    ])
    .setRequired(true);

  addSharedDeclarations(form, false);
}

/**
 * Media consent is a separate, OPTIONAL question on purpose. Selected matches are
 * recorded and clips are shared, so consent must be freely given and refusable — a
 * required "I agree to be filmed" box is not consent. Note who said no and keep them
 * out of published footage.
 */
function addSharedDeclarations(form, isMinor) {
  form.addCheckboxItem()
    .setTitle('Rules and accuracy')
    .setChoiceValues([
      'The details above are accurate, and I will bring photo ID for verification at check-in.',
      'I accept the tournament format, rules and the referee’s decisions.',
      'I understand that entry is confirmed only when the organiser replies, and that ' +
        'slots are limited.',
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Photo and video consent')
    .setHelpText(
      'Selected matches may be recorded, and photos or clips may be shared on the ' +
      'tournament’s channels. This is optional and does not affect your entry.' +
      (isMinor ? ' As parent or guardian, answer on the player’s behalf.' : '')
    )
    .setChoiceValues([
      'Yes — happy to appear in photos and video',
      'No — please keep me out of published photos and video',
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Anything we should know?')
    .setHelpText('Medical conditions, injuries, accessibility needs, or scheduling constraints.')
    .setRequired(false);
}

// ---------------------------------------------------------------------------
// Optional: close categories as they fill
// ---------------------------------------------------------------------------

/**
 * Google Forms cannot cap responses on its own. Run this from a form-submit trigger and
 * a category disappears from the list once it is full, instead of taking entries you
 * cannot honour.
 *
 * To install, run installCapTrigger() ONCE with the form id.
 */
function updateCategoryAvailability(formId) {
  var form = FormApp.openById(formId);
  var counts = {};

  var items = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
  var categoryItem = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === CATEGORY_QUESTION) {
      categoryItem = items[i].asMultipleChoiceItem();
      break;
    }
  }
  if (!categoryItem) throw new Error('Category question not found — was it renamed?');

  var responses = form.getResponses();
  for (var r = 0; r < responses.length; r++) {
    var answers = responses[r].getItemResponses();
    for (var a = 0; a < answers.length; a++) {
      if (answers[a].getItem().getTitle() === CATEGORY_QUESTION) {
        var label = answers[a].getResponse();
        counts[label] = (counts[label] || 0) + 1;
      }
    }
  }

  // Page breaks are matched by title so the navigation survives a rebuild.
  var pages = form.getItems(FormApp.ItemType.PAGE_BREAK);
  function pageByTitlePrefix(prefix) {
    for (var p = 0; p < pages.length; p++) {
      if (pages[p].getTitle().indexOf(prefix) === 0) return pages[p].asPageBreakItem();
    }
    return null;
  }
  var targets = {
    'U17_SINGLES': pageByTitlePrefix('Under-17 Singles'),
    'U17_DOUBLES': pageByTitlePrefix('Under-17 Doubles'),
    'ADULT_MD': pageByTitlePrefix('Adults Doubles'),
    'ADULT_XD': pageByTitlePrefix('Adults Doubles'),
  };

  var choices = [];
  var closed = [];
  for (var c = 0; c < CATEGORIES.length; c++) {
    var cat = CATEGORIES[c];
    var used = counts[cat.label] || 0;
    if (used >= cat.cap) {
      closed.push(cat.label + ' (' + used + '/' + cat.cap + ' ' + cat.unit + ')');
      continue;
    }
    choices.push(categoryItem.createChoice(cat.label, targets[cat.key]));
  }

  if (choices.length === 0) {
    form.setAcceptingResponses(false);
    Logger.log('Every category is full — the form is now closed.');
    return;
  }

  categoryItem.setChoices(choices);
  Logger.log('Open: ' + choices.length + ' categories. Closed: ' + (closed.join(', ') || 'none'));
}

/** Run once. Paste the form id from its edit URL (.../forms/d/<ID>/edit). */
function installCapTrigger() {
  var FORM_ID = 'PASTE_FORM_ID_HERE';
  ScriptApp.newTrigger('onEntrySubmitted').forForm(FORM_ID).onFormSubmit().create();
  Logger.log('Trigger installed for form ' + FORM_ID);
}

function onEntrySubmitted(e) {
  updateCategoryAvailability(e.source.getId());
}
