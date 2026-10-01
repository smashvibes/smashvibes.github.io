/**
 * StarRise Cup 2026 — builds the registration Google Form and its response sheet.
 *
 * TWO ENTRY POINTS
 *
 *   updateExistingForm()      Applies this file's structure to the form already live at
 *                             FORM_ID. Use this for every change from now on — it keeps
 *                             the URL that is wired into the website. Safe to re-run.
 *
 *   createRegistrationForm()  Builds a brand new form from scratch. Only for starting
 *                             over; it produces a DIFFERENT url that the site will not
 *                             be pointing at.
 *
 * HOW TO RUN
 *   1. Go to https://script.google.com and open the existing project (or press
 *      "New project" the first time).
 *   2. Select everything in the Code.gs editor and paste this whole file over it.
 *   3. Save (Ctrl/Cmd+S), pick the function you want in the dropdown next to Run,
 *      and press Run.
 *   4. First run only: approve the permissions prompt. Google warns that the app is
 *      unverified — expected for your own script. Click "Advanced", then
 *      "Go to <project name> (unsafe)", then "Allow".
 *   5. The Execution log at the bottom reports what changed.
 */

// ---------------------------------------------------------------------------
// Event constants. Change these before running.
// ---------------------------------------------------------------------------

/** The live form. Its /viewform url is wired into src/data/tournament.ts. */
var FORM_ID = '1YNtTzgFumfKaYvcaKYQaUV1p-gbDuT8Q6vwOgKCwBS4';

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

/**
 * Entry caps from the tournament page. Used by updateCategoryAvailability().
 *
 * Men's and Mixed Doubles are ONE entry category: the tournament page runs them combined
 * across 2 groups of 5 pairs, so the cap is the 10 pairs those groups hold. Which of the
 * two a pair is playing follows from the two players' genders, already collected — no
 * extra question needed.
 */
var CATEGORIES = [
  { key: 'U17_SINGLES', label: 'Under-17 Singles', cap: 16, unit: 'entries' },
  { key: 'U17_DOUBLES', label: 'Under-17 Doubles', cap: 16, unit: 'pairs' },
  { key: 'ADULT_OPEN', label: "Adults Open — Men's / Mixed Doubles", cap: 10, unit: 'pairs' },
];

var CATEGORY_QUESTION = 'Which category are you entering?';

/** Page titles. Used to find pages again on update, so do not edit them casually. */
var PAGE = {
  singles: 'Under-17 Singles — player details',
  u17Doubles: 'Under-17 Doubles — pair details',
  adults: "Adults Open — Men's / Mixed Doubles — pair details",
  disclaimer: 'Disclaimer, Assumption of Risk and Waiver',
};

/** Shown above the waiver clauses. */
var DISCLAIMER_INTRO =
  'By registering for and/or participating in the badminton tournament ("Tournament"), ' +
  'each participant acknowledges and agrees to the following terms.';

/**
 * Supplied by the organiser. Reproduced verbatim — this is legal text, so the wording is
 * not ours to tidy. (It carries a few typographic slips: a space before the full stop in
 * "equipment .", and two clauses with no closing full stop. Fix them in this array if the
 * organiser wants them fixed.)
 */
var DISCLAIMER_CLAUSES = [
  {
    title: 'Injury or Death',
    body:
      'The organiser, its organisers, committee members, volunteers, officials, referees, ' +
      'coaches, venue owners, sponsors and their respective employees, agents and ' +
      'representatives shall not be liable for any injury, illness, disability or death ' +
      'suffered by a participant arising out of or in connection with participation in the ' +
      'Tournament, except to the extent that such liability cannot lawfully be excluded or ' +
      'limited.',
  },
  {
    title: 'Loss or Damage to Property',
    body:
      'Participants are responsible for their own personal belongings and equipment . The ' +
      'organiser shall not be responsible or liable for any loss, theft, damage or ' +
      'destruction of any personal property',
  },
  {
    title: 'Medical Assistance',
    body:
      'In the event of an injury or medical emergency, the organiser may arrange or ' +
      'facilitate appropriate medical assistance or emergency services. Participants ' +
      'acknowledge that they may be responsible for any medical, ambulance, hospital or ' +
      'other expenses incurred.',
  },
  {
    title: 'Compliance with Rules',
    body:
      'Participants agree to comply with the Tournament rules, venue rules and reasonable ' +
      'instructions given by the organiser, officials and venue staff. The organiser ' +
      "reserves the right to refuse or terminate participation where a participant's " +
      'conduct presents a risk to himself/herself or others.',
  },
  {
    title: 'Responsibility for Minors',
    body:
      "Where a participant is under 18 years of age, the participant's parent or legal " +
      "guardian must provide consent to the participant's participation and acknowledge " +
      "these terms on the participant's behalf.",
  },
  {
    title: 'Release and Waiver',
    body:
      'To the fullest extent permitted by law, each participant releases and holds ' +
      'harmless the organiser and the persons and entities referred to above from claims, ' +
      'demands, losses, damages, costs and expenses arising from or connected with the ' +
      "participant's participation in the Tournament, including claims relating to " +
      'personal injury, illness, death or loss or damage to property',
  },
  {
    title: 'No Exclusion of Non-Excludable Liability',
    body:
      'Nothing in this disclaimer is intended to exclude, restrict or limit any liability ' +
      'which cannot lawfully be excluded, restricted or limited under applicable law.',
  },
];

var DISCLAIMER_TICK =
  'I have read, understood and agree to the Disclaimer, Assumption of Risk and Waiver ' +
  'above. Where the participant is under 18, I confirm I am the parent or legal guardian ' +
  'and agree on the participant\u2019s behalf.';

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
  var singlesPage = form.addPageBreakItem().setTitle(PAGE.singles);
  addPlayerBlock(form, 'Player', true);
  addGuardianBlock(form);
  addTeenDeclarations(form);

  var u17DoublesPage = form.addPageBreakItem()
    .setTitle(PAGE.u17Doubles)
    .setHelpText('Submit once per pair. Both players must meet the age cut-off.');
  addPlayerBlock(form, 'Player 1', true);
  addPlayerBlock(form, 'Player 2 (partner)', false);
  addGuardianBlock(form);
  addTeenDeclarations(form);

  var adultPage = form.addPageBreakItem()
    .setTitle(PAGE.adults)
    .setHelpText(
      'Submit once per pair. Men\u2019s and Mixed Doubles are entered together; a Mixed ' +
      'pair is one man and one woman.'
    );
  addPlayerBlock(form, 'Player 1', true);
  addPlayerBlock(form, 'Player 2 (partner)', false);
  addEmergencyBlock(form);
  addAdultDeclarations(form);

  // --- Shared final page: the waiver everyone must accept -------------------
  var disclaimerPage = addDisclaimerPage(form);

  // Every branch ends at the disclaimer, which then submits.
  singlesPage.setGoToPage(disclaimerPage);
  u17DoublesPage.setGoToPage(disclaimerPage);
  adultPage.setGoToPage(disclaimerPage);
  disclaimerPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  // Wire the branching now that the target pages exist.
  categoryItem.setChoices([
    categoryItem.createChoice(CATEGORIES[0].label, singlesPage),
    categoryItem.createChoice(CATEGORIES[1].label, u17DoublesPage),
    categoryItem.createChoice(CATEGORIES[2].label, adultPage),
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

/**
 * Force EVERY box to be ticked.
 *
 * `setRequired(true)` on a checkbox only demands one tick, not all of them — so a
 * declaration list marked required could be submitted with a single box checked and the
 * rest ignored. Validation is the only thing that actually binds the respondent to all
 * of them.
 */
function requireAll(item) {
  item.setValidation(
    FormApp.createCheckboxValidation()
      .setHelpText('Please tick every box to continue.')
      .requireSelectExactly(item.getChoices().length)
      .build()
  );
  return item;
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

  requireAll(
    form.addCheckboxItem()
      .setTitle('Eligibility')
      .setChoiceValues([
        'I confirm every player listed is ' + EVENT.u17CutoffText + '.',
        'I confirm no player listed is a current Junior National player, or represents any ' +
          'country in any form.',
      ])
      .setRequired(true)
  );

  addSharedDeclarations(form, true);
}

function addAdultDeclarations(form) {
  form.addSectionHeaderItem().setTitle('Declarations');

  requireAll(
    form.addCheckboxItem()
      .setTitle('Eligibility')
      .setChoiceValues([
        'I confirm neither player is a national-level or state-level player.',
      ])
      .setRequired(true)
  );

  addSharedDeclarations(form, false);
}

/**
 * Media consent is a separate, OPTIONAL question on purpose. Selected matches are
 * recorded and clips are shared, so consent must be freely given and refusable — a
 * required "I agree to be filmed" box is not consent. Note who said no and keep them
 * out of published footage.
 */
function addSharedDeclarations(form, isMinor) {
  requireAll(
    form.addCheckboxItem()
      .setTitle('Rules and accuracy')
      .setChoiceValues([
        'The details above are accurate, and I will bring photo ID for verification at check-in.',
        'I accept the tournament format, rules and the referee\u2019s decisions.',
        'I understand that entry is confirmed only when the organiser replies, and that ' +
          'slots are limited.',
      ])
      .setRequired(true)
  );

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
// The waiver page
// ---------------------------------------------------------------------------

/**
 * Appends the waiver page and returns its page break.
 *
 * It lives on its own final page rather than being repeated on each branch, so there is
 * exactly one copy of the legal text and every entrant — whichever category they chose —
 * finishes on it.
 */
function addDisclaimerPage(form) {
  var page = form.addPageBreakItem()
    .setTitle(PAGE.disclaimer)
    .setHelpText(DISCLAIMER_INTRO);

  for (var i = 0; i < DISCLAIMER_CLAUSES.length; i++) {
    form.addSectionHeaderItem()
      .setTitle((i + 1) + '. ' + DISCLAIMER_CLAUSES[i].title)
      .setHelpText(DISCLAIMER_CLAUSES[i].body);
  }

  requireAll(
    form.addCheckboxItem()
      .setTitle('Agreement')
      .setHelpText(
        'By registering for or participating in the Tournament, the participant confirms ' +
        'that he or she has read, understood and agreed to the above terms.'
      )
      .setChoiceValues([DISCLAIMER_TICK])
      .setRequired(true)
  );

  return page;
}

// ---------------------------------------------------------------------------
// Updating the live form
// ---------------------------------------------------------------------------

/**
 * Brings the form at FORM_ID in line with this file, without changing its url.
 *
 * Safe to re-run: it finds pages by title and only adds the waiver page if it is missing.
 * What it does NOT do is rewrite the per-player questions — editing those in place would
 * orphan existing responses. If you change a question, do it in the Forms UI.
 */
function updateExistingForm() {
  var form = FormApp.openById(FORM_ID);
  var changes = [];

  var pages = {};
  var breaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  for (var i = 0; i < breaks.length; i++) {
    pages[breaks[i].getTitle()] = breaks[i].asPageBreakItem();
  }

  // The adults page was two categories when the form was first built; it is one now.
  var adultPage = pages[PAGE.adults] || pages['Adults Doubles — pair details'];
  if (!adultPage) throw new Error('Adults page not found — was it renamed in the Forms UI?');
  if (adultPage.getTitle() !== PAGE.adults) {
    adultPage.setTitle(PAGE.adults).setHelpText(
      'Submit once per pair. Men\u2019s and Mixed Doubles are entered together; a Mixed ' +
      'pair is one man and one woman.'
    );
    changes.push('renamed the adults page');
  }

  var singlesPage = pages[PAGE.singles];
  var u17DoublesPage = pages[PAGE.u17Doubles];
  if (!singlesPage || !u17DoublesPage) throw new Error('Under-17 pages not found.');

  // Waiver page: add it only once.
  var disclaimerPage = pages[PAGE.disclaimer];
  if (!disclaimerPage) {
    disclaimerPage = addDisclaimerPage(form);
    changes.push('added the waiver page with ' + DISCLAIMER_CLAUSES.length + ' clauses');
  } else {
    changes.push('waiver page already present, left as is');
  }

  // Forms puts Submit on whichever section is physically last, so the waiver has to be
  // there regardless of what the branch navigation says.
  if (ensureWaiverLast(form)) changes.push('moved the waiver to the end of the form');

  // Every branch now ends on the waiver instead of submitting.
  singlesPage.setGoToPage(disclaimerPage);
  u17DoublesPage.setGoToPage(disclaimerPage);
  adultPage.setGoToPage(disclaimerPage);
  disclaimerPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  changes.push('routed all three branches to the waiver');

  // Three categories, with the adults pair combined.
  var categoryItem = findMultipleChoice(form, CATEGORY_QUESTION);
  if (!categoryItem) throw new Error('Category question not found — was it renamed?');
  categoryItem.setChoices([
    categoryItem.createChoice(CATEGORIES[0].label, singlesPage),
    categoryItem.createChoice(CATEGORIES[1].label, u17DoublesPage),
    categoryItem.createChoice(CATEGORIES[2].label, adultPage),
  ]);
  changes.push('category question now offers ' + CATEGORIES.length + ' options');

  // Retro-fix: every declaration list should demand all of its boxes, not just one.
  var checkboxes = form.getItems(FormApp.ItemType.CHECKBOX);
  var fixed = 0;
  for (var c = 0; c < checkboxes.length; c++) {
    var box = checkboxes[c].asCheckboxItem();
    if (box.isRequired()) {
      requireAll(box);
      fixed += 1;
    }
  }
  changes.push('tightened ' + fixed + ' declaration lists to require every box');

  Logger.log('Updated ' + form.getPublishedUrl());
  for (var k = 0; k < changes.length; k++) Logger.log('  - ' + changes[k]);

  // Print the resulting order every time. Section position is what decides whether Forms
  // shows Next or Submit, so it is the one thing worth seeing after every run.
  Logger.log('');
  Logger.log('Section order now:');
  Logger.log('  1. (category question)');
  var finalBreaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  for (var b = 0; b < finalBreaks.length; b++) {
    var isLast = b === finalBreaks.length - 1;
    Logger.log('  ' + (b + 2) + '. ' + finalBreaks[b].getTitle() +
               (isLast ? '   <- last section, shows Submit' : ''));
  }
  if (!finalBreaks.length || finalBreaks[finalBreaks.length - 1].getTitle() !== PAGE.disclaimer) {
    Logger.log('');
    Logger.log('WARNING: the waiver is not last. Entrants finishing on the last section');
    Logger.log('will never see it. Run verifyForm() for detail.');
  }
}

function findMultipleChoice(form, title) {
  var items = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === title) return items[i].asMultipleChoiceItem();
  }
  return null;
}

/**
 * Moves the waiver page and its clauses to the end of the form.
 *
 * Branch navigation alone is not enough: Forms shows "Submit" rather than "Next" on
 * whichever section is physically last, so a waiver sitting mid-form leaves an entry
 * section able to finish the form. Re-running the updater after someone has dragged
 * sections about in the editor puts it right.
 */
function ensureWaiverLast(form) {
  var items = form.getItems();
  var start = -1;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getType() === FormApp.ItemType.PAGE_BREAK &&
        items[i].getTitle() === PAGE.disclaimer) {
      start = i;
      break;
    }
  }
  if (start === -1) return false;

  // The block runs to the next page break, or to the end of the form.
  var end = items.length - 1;
  for (var j = start + 1; j < items.length; j++) {
    if (items[j].getType() === FormApp.ItemType.PAGE_BREAK) {
      end = j - 1;
      break;
    }
  }
  if (end === items.length - 1) return false; // already last

  // Taking the block's first item to the end, repeatedly, preserves its internal order.
  var count = end - start + 1;
  for (var k = 0; k < count; k++) {
    form.moveItem(start, form.getItems().length - 1);
  }
  return true;
}

/**
 * Lists every StarRise form on this account, so it is obvious which one the website
 * points at and which are leftovers from an earlier run.
 */
function listRegistrationForms() {
  var files = DriveApp.getFilesByType(MimeType.GOOGLE_FORMS);
  var found = 0;
  Logger.log('Forms on this account matching "StarRise":');
  while (files.hasNext()) {
    var file = files.next();
    if (file.getName().indexOf('StarRise') === -1) continue;
    found += 1;
    var f = FormApp.openById(file.getId());
    var breaks = f.getItems(FormApp.ItemType.PAGE_BREAK);
    var hasWaiver = false;
    var waiverLast = false;
    for (var i = 0; i < breaks.length; i++) {
      if (breaks[i].getTitle() === PAGE.disclaimer) {
        hasWaiver = true;
        waiverLast = (i === breaks.length - 1);
      }
    }
    var cat = findMultipleChoice(f, CATEGORY_QUESTION);
    Logger.log('');
    Logger.log('  ' + file.getName());
    Logger.log('    id        : ' + file.getId() + (file.getId() === FORM_ID ? '   <-- FORM_ID, the one the website uses' : ''));
    Logger.log('    link      : ' + f.getPublishedUrl());
    Logger.log('    sections  : ' + (breaks.length + 1));
    Logger.log('    categories: ' + (cat ? cat.getChoices().length : 'n/a'));
    Logger.log('    waiver    : ' + (!hasWaiver ? 'MISSING' : (waiverLast ? 'present, last' : 'present but NOT last — entrants can skip it')));
  }
  if (found === 0) Logger.log('  (none found)');
  Logger.log('');
  Logger.log('Delete or rename the ones you are not using, so nobody tests the wrong link.');
}

/**
 * Prints the live form's branching so you can confirm it without clicking through.
 *
 * Every entry section must end at the waiver, and the waiver must submit. Anything else
 * means a respondent can finish without accepting the terms.
 */
function verifyForm() {
  var form = FormApp.openById(FORM_ID);
  var problems = [];

  var breaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  var names = {};
  for (var i = 0; i < breaks.length; i++) names[breaks[i].getId()] = breaks[i].getTitle();

  Logger.log('SECTIONS (' + (breaks.length + 1) + ' including the first):');
  Logger.log('  1. (category question)');
  for (var b = 0; b < breaks.length; b++) {
    var pb = breaks[b].asPageBreakItem();
    var target = pb.getGoToPage();
    var nav = target ? target.getTitle() : String(pb.getPageNavigationType());
    Logger.log('  ' + (b + 2) + '. ' + pb.getTitle() + '   ->  ' + nav);

    var isWaiver = pb.getTitle() === PAGE.disclaimer;
    if (!isWaiver && (!target || target.getTitle() !== PAGE.disclaimer)) {
      problems.push('"' + pb.getTitle() + '" does not lead to the waiver');
    }
    if (isWaiver && target) {
      problems.push('the waiver should submit, not continue to "' + target.getTitle() + '"');
    }
  }

  var categoryItem = findMultipleChoice(form, CATEGORY_QUESTION);
  Logger.log('');
  Logger.log('CATEGORY OPTIONS:');
  var choices = categoryItem ? categoryItem.getChoices() : [];
  for (var c = 0; c < choices.length; c++) {
    var page = choices[c].getGotoPage();
    Logger.log('  ' + choices[c].getValue() + '  ->  ' + (page ? page.getTitle() : 'NO BRANCH'));
    if (!page) problems.push('"' + choices[c].getValue() + '" has no branch set');
  }
  if (choices.length !== CATEGORIES.length) {
    problems.push('expected ' + CATEGORIES.length + ' categories, found ' + choices.length);
  }

  // The waiver is worthless if its tick is optional or can be skipped.
  var agreement = null;
  var boxes = form.getItems(FormApp.ItemType.CHECKBOX);
  for (var k = 0; k < boxes.length; k++) {
    if (boxes[k].getTitle() === 'Agreement') agreement = boxes[k].asCheckboxItem();
  }
  var lastBreak = breaks.length ? breaks[breaks.length - 1] : null;
  if (lastBreak && lastBreak.getTitle() !== PAGE.disclaimer) {
    problems.push('the waiver is not the last section — Forms shows Submit on "' +
                  lastBreak.getTitle() + '" instead of Next');
  }

  Logger.log('');
  if (!agreement) {
    problems.push('the waiver has no "Agreement" tick box');
  } else if (!agreement.isRequired()) {
    problems.push('the waiver tick box is not required');
  } else {
    Logger.log('WAIVER: "Agreement" tick box present and required.');
  }

  Logger.log('');
  if (problems.length === 0) {
    Logger.log('OK — every path ends at the waiver.');
  } else {
    Logger.log('PROBLEMS (' + problems.length + '):');
    for (var q = 0; q < problems.length; q++) Logger.log('  - ' + problems[q]);
  }
  Logger.log('');
  Logger.log('Test it at: ' + form.getPublishedUrl());
  Logger.log('Open that in a private window — Forms caches an open tab, so a tab you had');
  Logger.log('up before the update will still show the old flow until it is reloaded.');
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

  var categoryItem = findMultipleChoice(form, CATEGORY_QUESTION);
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
    'ADULT_OPEN': pageByTitlePrefix('Adults Open'),
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
