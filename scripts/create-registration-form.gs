/**
 * StarRise Cup 2026 — builds the registration Google Form and its response sheet.
 *
 * RUN THESE (the others are internal helpers):
 *
 *   updateExistingForm()       the one to run after any change
 *   verifyForm()               checks every path reaches the rules and waiver page
 *   listRegistrationForms()    finds duplicate forms on the account
 *   ensureWaiverLast()         moves the waiver to the end, on its own
 *   installCloseTrigger()      run ONCE: stops responses after the closing date
 *   installSheetTriggers()     run ONCE: caps each category from the response sheet
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

/**
 * FORM_ID must be the id from the EDIT link (.../forms/d/<ID>/edit). The share link
 * (.../forms/d/e/1FAIpQL.../viewform) carries a different id that openById rejects.
 */
function openLiveForm() {
  try {
    return FormApp.openById(FORM_ID);
  } catch (err) {
    throw new Error(
      'Cannot open the form with FORM_ID "' + FORM_ID + '". Use the id from the form\'s ' +
      'EDIT link (between /forms/d/ and /edit), not the share link, and run this from the ' +
      'Google account that owns the form. (' + err.message + ')'
    );
  }
}

var EVENT = {
  name: 'StarRise Cup 2026',
  date: '14 November 2026 (Saturday)',
  time: '10:00 AM – 5:00 PM',
  venue: 'SBH VIP Hall @ Sims, 1 Lorong 23 Geylang, Singapore 388352',
  // From the Rules & Regulations (as of 6 Oct 26), clause 5.1: the teen categories are
  // "17yrs old and below as of 14 Nov 26". A player born on 15 Nov 2008 is still 17 on
  // the day, so that is the cut-off. Keep this in step with RULES below — entrants tick
  // both, and the two must not disagree.
  u17CutoffText: '17 years old or below on 14 November 2026 (born on or after 15 November 2008)',
  contact: 'WhatsApp 9683 4290',
  closingDate: '7 November 2026 (Saturday)',
  // Midnight at the end of the closing date, Singapore time. Used by installCloseTrigger().
  closesAt: new Date('2026-11-08T00:00:00+08:00'),
};

/**
 * PayNow shows the payer a masked name before they confirm, so both are given: the masked
 * one to match against what the app displays, the full one in brackets.
 */
var PAYMENT = {
  paynow: '8088 6684',
  maskedName: 'MUHAMXXX DANXXX BIX MOHAXXX AIZXX',
  fullName: 'Muhammad Danial bin Mohamed Aizam',
};

/**
 * Entry caps. Enforced against the response sheet's Status column — see "Category caps"
 * near the end of this file.
 *
 * Men's and Mixed Doubles are ONE entry category: the tournament runs them combined as a
 * single Open Doubles draw of 16 pairs (four groups of four, then a knockout — organiser's
 * draws of 6 Oct 26), so that is the cap. Which of the two a pair is playing follows from
 * the two players' genders, already collected — no extra question needed.
 *
 * Labels are matched against past responses to count entries, so renaming one resets its
 * count to zero. `fee` is display text only.
 */
var CATEGORIES = [
  { key: 'U17_SINGLES', label: 'Under-17 Singles', cap: 16, unit: 'entries', fee: '$50 per player' },
  { key: 'U17_DOUBLES', label: 'Under-17 Doubles', cap: 16, unit: 'pairs', fee: '$80 per pair' },
  { key: 'ADULT_OPEN', label: "Adults Open — Men's / Mixed Doubles", cap: 16, unit: 'pairs', fee: '$80 per pair' },
];

var CATEGORY_QUESTION = 'Which category are you entering?';

/** Page titles. Used to find pages again on update, so do not edit them casually. */
var PAGE = {
  singles: 'Under-17 Singles — player details',
  u17Doubles: 'Under-17 Doubles — pair details',
  adults: "Adults Open — Men's / Mixed Doubles — pair details",
  disclaimer: 'Rules & Regulations, Disclaimer and Waiver',
};

/** What the final page was called before the full rules were added. Renamed on update. */
var LEGACY_DISCLAIMER_TITLE = 'Disclaimer, Assumption of Risk and Waiver';

function isWaiverTitle(title) {
  return title === PAGE.disclaimer || title === LEGACY_DISCLAIMER_TITLE;
}

var RULES_AS_OF = '6 Oct 26';

/** Shown at the top of the final page. */
var RULES_PAGE_INTRO =
  'Please read the Star Rise Cup 2026 Rules & Regulations (as of ' + RULES_AS_OF + ') ' +
  'below. Both boxes at the bottom must be ticked to submit your entry.';

/**
 * The organiser's Rules & Regulations (as of 6 Oct 26), clauses 1–8 and 10. Clause 9 is
 * the waiver, kept in DISCLAIMER_CLAUSES. Reproduced verbatim, with one exception: the
 * PDF numbers the first sub-clause of 10 as "8.1", corrected here to 10.1.
 */
var RULES_BEFORE_WAIVER = [
  { title: '1. Title', body: 'Star Rise Cup 2026' },
  { title: '2. Organisers', body: 'Global Barrels\nFresh Cars Pte Ltd\nDanial' },
  { title: '3. Venue', body: 'SBH@Geylang VIP Hall' },
  {
    title: '4. Tournament Rules',
    body:
      'The Tournament shall be conducted in accordance with the existing Rules approved by ' +
      'the Badminton World Federation unless stated otherwise.',
  },
  {
    title: '5. Official Registration',
    body:
      '5.1 There will be 3 categories for this tournament, namely:\n' +
      'i) Teen Singles – TS (17yrs old and below as of 14 Nov 26)\n' +
      'ii) Teen Doubles – TD (17yrs old and below as of 14 Nov 26)\n' +
      'iii) Open Doubles – OD (no age restrictions)',
  },
  {
    title: '6. Tournament System',
    body: [
      '6.1 The 16 individuals/pairs in each category will be placed in 4 separate groups of ' +
        '4 individuals/pairs each and they will play a Round Robin format where the 4 ' +
        'individuals/pairs in each group will play one another once. The Top Two ' +
        'individuals/pairs from each group will qualify for the quarter-finals round.',
      '6.2 The winner of each tie will be awarded 1 league point. No points for losing ' +
        'individual/pair or walkover. The individual/pair with the greatest number of points ' +
        'after all the round robin matches had been completed will be declared the top of ' +
        'the group.',
      '6.3 Should there be a tie in league points between two or more individuals/pairs, the ' +
        'position shall be established by considering the difference of the points for and ' +
        'against, in the matches among the individuals/pairs having equal points, The ' +
        'individual/pair with better points difference will be awarded the higher position.',
      '6.4 If a tie persists, classification shall be made taking into consideration all ' +
        'the matches played.',
      '6.5 If a tie persists, classification shall be made by a toss of coin.',
      '6.6 Fixtures will only be made known one week before tournament day.',
      '6.7 The scoring system for all round robin and quarter-finals matches will be one ' +
        'game, race to 15 points with no setting when the score reaches 14-all.',
      '6.8 The scoring system for semi-finals rounds onwards would be decided after the ' +
        'completion of the all round robin and quarter-finals matches.',
      '6.9 All matches will be played according to the Schedule of Play.',
      '6.10 Players will be given a grace period of 5 minutes for their presence on court ' +
        'for their respective matches. Players who report later than the grace period will ' +
        'concede a walkover for that match.',
    ].join('\n\n'),
  },
  {
    title: '7. Prizes',
    body:
      '7.1 Medals & Prizes will be awarded to only the 1st and 2nd placings of all 3 ' +
      'categories.\n\n' +
      '7.2 The Coach of the respective winner of each category will be awarded with a cash ' +
      'prize of S$500.00.',
  },
  {
    title: '8. First Aid & Medical Coverage',
    body:
      'All participants shall be responsible for their own medical coverage and accident ' +
      'insurance.',
  },
];

var RULES_AFTER_WAIVER = [
  {
    title: '10. Interpretation Clause',
    body:
      '10.1 Any arising matters, which are not covered in this Tournament Rules & ' +
      'Regulations, shall be decided by the Organiser, whose decision shall be final.\n\n' +
      '10.2 The Rules & Regulations as depicted above are current at the time of printing. ' +
      'The Organising Committee reserves the right to add, delete and/or vary the said Rules ' +
      'and Regulations at any time as it deems fits.\n\n' +
      '10.3 The decision of the Organising Committee on all matters shall be final.',
  },
];

var WAIVER_HEADING = '9. Badminton Tournament Disclaimer, Assumption of Risk and Waiver';

/** Shown under the waiver heading. */
var DISCLAIMER_INTRO =
  'By registering for and/or participating in the badminton tournament ("Tournament"), ' +
  'each participant acknowledges and agrees to the following terms:';

/**
 * Clause 9 of the Rules & Regulations (as of 6 Oct 26). Reproduced verbatim — this is
 * legal text, so the wording is not ours to tidy.
 */
var DISCLAIMER_CLAUSES = [
  {
    title: 'Injury or Death',
    body:
      'The Organiser, its Organisers, committee members, volunteers, officials, referees, ' +
      'coaches, venue owners, sponsors and their respective employees, agents and ' +
      'representatives shall not be liable for any injury, illness, disability or death ' +
      'suffered by a participant arising out of or in connection with participation in the ' +
      'Tournament, except to the extent that such liability cannot lawfully be excluded or ' +
      'limited.',
  },
  {
    title: 'Loss or Damage to Property',
    body:
      'Participants are responsible for their own personal belongings and equipment. The ' +
      'Organiser shall not be responsible or liable for any loss, theft, damage or ' +
      'destruction of any personal property.',
  },
  {
    title: 'Medical Assistance',
    body:
      'In the event of an injury or medical emergency, the Organiser may arrange or ' +
      'facilitate appropriate medical assistance or emergency services. Participants ' +
      'acknowledge that they may be responsible for any medical, ambulance, hospital or ' +
      'other expenses incurred.',
  },
  {
    title: 'Compliance with Rules',
    body:
      'Participants agree to comply with the Tournament rules, venue rules and reasonable ' +
      'instructions given by the Organiser, officials and venue staff. The Organiser ' +
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
      'harmless the Organiser and the persons and entities referred to above from claims, ' +
      'demands, losses, damages, costs and expenses arising from or connected with the ' +
      "participant's participation in the Tournament, including claims relating to " +
      'personal injury, illness, death or loss or damage to property.',
  },
  {
    title: 'No Exclusion of Non-Excludable Liability',
    body:
      'Nothing in this disclaimer is intended to exclude, restrict or limit any liability ' +
      'which cannot lawfully be excluded, restricted or limited under applicable law.',
  },
];

/**
 * Every section header on the final page, in order: clauses 1–8, the waiver (9), then 10.
 * Headers carry no responses, so the updater can safely delete and rebuild them.
 */
function rulesPageHeaders() {
  var headers = RULES_BEFORE_WAIVER.slice();
  headers.push({ title: WAIVER_HEADING, body: DISCLAIMER_INTRO });
  for (var i = 0; i < DISCLAIMER_CLAUSES.length; i++) {
    headers.push({
      title: '9.' + (i + 1) + ' ' + DISCLAIMER_CLAUSES[i].title,
      body: DISCLAIMER_CLAUSES[i].body,
    });
  }
  return headers.concat(RULES_AFTER_WAIVER);
}

/** A separate tick from the waiver's, so the sheet records each acceptance on its own. */
var RULES_TICK_TITLE = 'Rules & Regulations';
var RULES_TICK =
  'I have read, understood and agree to the Star Rise Cup 2026 Rules & Regulations ' +
  '(as of ' + RULES_AS_OF + ') above.';

var DISCLAIMER_TICK =
  'I have read, understood and agree to the Disclaimer, Assumption of Risk and Waiver ' +
  'above. Where the participant is under 18, I confirm I am the parent or legal guardian ' +
  'and agree on the participant’s behalf.';

/** Opening text of the under-17 eligibility tick; the rest is EVENT.u17CutoffText. */
var U17_ELIGIBILITY_PREFIX = 'I confirm every player listed is ';

// ---------------------------------------------------------------------------
// Page 1 text. Rewritten on every update, so edit it here rather than in the Forms UI.
// ---------------------------------------------------------------------------

function feeLines() {
  var lines = [];
  for (var i = 0; i < CATEGORIES.length; i++) {
    lines.push('• ' + CATEGORIES[i].label + ': ' + CATEGORIES[i].fee);
  }
  return lines.join('\n');
}

function formDescription() {
  return (
    EVENT.name + '\n' +
    EVENT.date + ', ' + EVENT.time + '\n' +
    EVENT.venue + '\n\n' +
    'Registration closes: ' + EVENT.closingDate + '\n\n' +
    'REGISTRATION FEE\n' +
    feeLines() + '\n\n' +
    'PAYMENT: PayNow to ' + PAYMENT.paynow + '\n' +
    PAYMENT.maskedName + ' (' + PAYMENT.fullName + ')\n\n' +
    'One submission per entry. Doubles pairs submit ONCE, with both players listed — the ' +
    'pair fee covers both.\n' +
    'Questions: ' + EVENT.contact
  );
}

/** `fullLabels`: categories currently closed, named so entrants know why one is missing. */
function categoryHelpText(fullLabels) {
  var full = fullLabels && fullLabels.length
    ? '\n\nFULL — no longer taking entries: ' + fullLabels.join(', ') + '.'
    : '';
  return (
    'Under-17: ' + EVENT.u17CutoffText + '.\n' +
    'Adults: open to social and recreational players. National- and state-level players ' +
    'are not eligible.\n\n' +
    'Fee: Singles $50 per player · Doubles $80 per pair.' +
    full
  );
}

/** Entrants cannot see their sheet status, so the message covers the waitlist case. */
var CONFIRMATION_MESSAGE =
  'Thanks — your entry is in. We will confirm your slot by WhatsApp before the event. ' +
  'If your category filled up while you were registering, you will be placed on the ' +
  'waitlist and we will tell you. If your plans change, tell us early so the slot can go ' +
  'to another player.';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function createRegistrationForm() {
  var form = FormApp.create(EVENT.name + ' — Player Registration');

  form.setDescription(formDescription());

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
  form.setConfirmationMessage(CONFIRMATION_MESSAGE);

  // --- Page 1: category ---------------------------------------------------
  var categoryItem = form.addMultipleChoiceItem()
    .setTitle(CATEGORY_QUESTION)
    .setHelpText(categoryHelpText())
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

  // Every branch ends at the disclaimer, which then submits. The adults page sits directly
  // before it, so it CONTINUEs: an explicit jump to the adjacent section is stored by
  // Forms as "Submit form", which would let adults skip the waiver.
  singlesPage.setGoToPage(disclaimerPage);
  u17DoublesPage.setGoToPage(disclaimerPage);
  adultPage.setGoToPage(FormApp.PageNavigationType.CONTINUE);
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
        U17_ELIGIBILITY_PREFIX + EVENT.u17CutoffText + '.',
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
  // Appends — running it on its own would add a SECOND waiver page.
  if (!form) {
    throw new Error('addDisclaimerPage is an internal helper. Run updateExistingForm() instead.');
  }
  var page = form.addPageBreakItem()
    .setTitle(PAGE.disclaimer)
    .setHelpText(RULES_PAGE_INTRO);

  var headers = rulesPageHeaders();
  for (var i = 0; i < headers.length; i++) {
    form.addSectionHeaderItem().setTitle(headers[i].title).setHelpText(headers[i].body);
  }

  addRulesTick(form);
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

function addRulesTick(form) {
  return requireAll(
    form.addCheckboxItem()
      .setTitle(RULES_TICK_TITLE)
      .setChoiceValues([RULES_TICK])
      .setRequired(true)
  );
}

/**
 * Brings the text on an existing final page in line with this file.
 *
 * Section headers hold no answers, so they are deleted and rebuilt rather than diffed.
 * The two tick boxes DO hold answers and are never deleted: the rules tick is added once
 * if missing, and the waiver's "Agreement" tick is left exactly as it is. Expects the
 * page to be last (run ensureWaiverLast first), because new items append to the end.
 */
function syncRulesPage(form) {
  var items = form.getItems();
  var start = -1;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getType() === FormApp.ItemType.PAGE_BREAK && isWaiverTitle(items[i].getTitle())) {
      start = i;
      break;
    }
  }
  if (start === -1) throw new Error('Final rules / waiver page not found.');

  var page = items[start].asPageBreakItem();
  page.setTitle(PAGE.disclaimer).setHelpText(RULES_PAGE_INTRO);

  var rulesTick = null;
  for (var j = items.length - 1; j > start; j--) {
    var type = items[j].getType();
    if (type === FormApp.ItemType.PAGE_BREAK) throw new Error('The rules page is not last.');
    if (type === FormApp.ItemType.SECTION_HEADER) form.deleteItem(items[j]);
    if (type === FormApp.ItemType.CHECKBOX && items[j].getTitle() === RULES_TICK_TITLE) {
      rulesTick = items[j];
    }
  }
  if (!rulesTick) rulesTick = addRulesTick(form);

  // Appended items land after the ticks; move each into place directly under the page
  // break, then the rules tick after them, which leaves "Agreement" last.
  //
  // Moved by index: moveItem(item, index) only accepts a plain Item, and throws a
  // signature error when handed a typed one such as SectionHeaderItem.
  var headers = rulesPageHeaders();
  for (var h = 0; h < headers.length; h++) {
    var header = form.addSectionHeaderItem()
      .setTitle(headers[h].title)
      .setHelpText(headers[h].body);
    form.moveItem(header.getIndex(), start + 1 + h);
  }
  form.moveItem(rulesTick.getIndex(), start + 1 + headers.length);
  return headers.length;
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
  var form = openLiveForm();
  var changes = [];

  // Page 1: event details, registration fee and eligibility.
  form.setDescription(formDescription());
  form.setConfirmationMessage(CONFIRMATION_MESSAGE);
  changes.push('set the form description, including the registration fee');

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

  // Rules and waiver page: add it only once, otherwise refresh its text in place.
  var disclaimerPage = pages[PAGE.disclaimer] || pages[LEGACY_DISCLAIMER_TITLE];
  var added = false;
  if (!disclaimerPage) {
    disclaimerPage = addDisclaimerPage(form);
    added = true;
    changes.push('added the rules and waiver page');
  }

  // Forms puts Submit on whichever section is physically last, so the waiver has to be
  // there regardless of what the branch navigation says.
  if (ensureWaiverLast(form)) changes.push('moved the waiver to the end of the form');

  if (!added) {
    var count = syncRulesPage(form);
    changes.push('rebuilt the rules page text (' + count + ' clauses) and its two ticks');
  }

  // Re-read the page breaks AFTER any move: references captured earlier can point at
  // stale positions, and navigation set through them silently fails to stick.
  var ordered = form.getItems(FormApp.ItemType.PAGE_BREAK);
  var byTitle = {};
  for (var o = 0; o < ordered.length; o++) byTitle[ordered[o].getTitle()] = ordered[o].asPageBreakItem();
  disclaimerPage = byTitle[PAGE.disclaimer];
  singlesPage = byTitle[PAGE.singles];
  u17DoublesPage = byTitle[PAGE.u17Doubles];
  adultPage = byTitle[PAGE.adults];

  var waiverIndex = -1;
  for (var w = 0; w < ordered.length; w++) {
    if (ordered[w].getTitle() === PAGE.disclaimer) waiverIndex = w;
  }

  /**
   * Point one section at the waiver.
   *
   * When the waiver is the very next section, use CONTINUE rather than an explicit
   * go-to. An explicit jump to the adjacent section is what Forms was storing as
   * "Submit form" — which is why the adults branch, sitting directly before the waiver,
   * ended the form while the two earlier branches jumped to it correctly.
   */
  function routeToWaiver(page, index) {
    if (index === waiverIndex - 1) {
      page.setGoToPage(FormApp.PageNavigationType.CONTINUE);
    } else {
      page.setGoToPage(disclaimerPage);
    }
  }
  for (var r2 = 0; r2 < ordered.length; r2++) {
    var pb = ordered[r2].asPageBreakItem();
    if (pb.getTitle() === PAGE.disclaimer) continue;
    routeToWaiver(pb, r2);
  }
  disclaimerPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  changes.push('routed all entry sections to the waiver');

  // Three categories, with the adults pair combined.
  var categoryItem = findMultipleChoice(form, CATEGORY_QUESTION);
  if (!categoryItem) throw new Error('Category question not found — was it renamed?');
  categoryItem.setHelpText(categoryHelpText());
  categoryItem.setChoices([
    categoryItem.createChoice(CATEGORIES[0].label, singlesPage),
    categoryItem.createChoice(CATEGORIES[1].label, u17DoublesPage),
    categoryItem.createChoice(CATEGORIES[2].label, adultPage),
  ]);
  changes.push('category question now offers ' + CATEGORIES.length + ' options');

  // The under-17 eligibility tick quotes the age cut-off; keep it matching the rules.
  // Older responses keep the wording they ticked — the sheet stores the text, not an index.
  var checkboxes = form.getItems(FormApp.ItemType.CHECKBOX);
  var retexted = 0;
  for (var e = 0; e < checkboxes.length; e++) {
    if (checkboxes[e].getTitle() !== 'Eligibility') continue;
    var eligibility = checkboxes[e].asCheckboxItem();
    var values = eligibility.getChoices().map(function (choice) { return choice.getValue(); });
    var updated = values.map(function (value) {
      return value.indexOf(U17_ELIGIBILITY_PREFIX) === 0
        ? U17_ELIGIBILITY_PREFIX + EVENT.u17CutoffText + '.'
        : value;
    });
    if (updated.join('\n') !== values.join('\n')) {
      eligibility.setChoiceValues(updated);
      retexted += 1;
    }
  }
  if (retexted) changes.push('updated the age cut-off on ' + retexted + ' eligibility ticks');

  // Retro-fix: every declaration list should demand all of its boxes, not just one.
  var fixed = 0;
  for (var c = 0; c < checkboxes.length; c++) {
    var box = checkboxes[c].asCheckboxItem();
    if (box.isRequired()) {
      requireAll(box);
      fixed += 1;
    }
  }
  changes.push('tightened ' + fixed + ' declaration lists to require every box');

  // The block above re-offers all three categories; take the full ones back out.
  try {
    updateCategoryAvailability(form);
    changes.push('re-applied the category caps from the response sheet');
  } catch (err) {
    changes.push('category caps NOT applied: ' + err.message);
  }

  Logger.log('Updated ' + form.getPublishedUrl());
  for (var k = 0; k < changes.length; k++) Logger.log('  - ' + changes[k]);

  // Print the resulting order every time. Section position is what decides whether Forms
  // shows Next or Submit, so it is the one thing worth seeing after every run.
  //
  // CAVEAT, learned the hard way on this form: getItems() has returned page breaks in an
  // order that did NOT match the order Forms renders them in, so the list below can look
  // right while the live form is wrong. The respondent view is the authority — open the
  // form and check that the waiver is the last section. If it is not, drag it to the end
  // in the editor; no API call has reliably moved it.
  Logger.log('');
  Logger.log('Section order as the API reports it (confirm against the live form):');
  Logger.log('  1. (category question)');
  var finalBreaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  for (var b = 0; b < finalBreaks.length; b++) {
    var isLast = b === finalBreaks.length - 1;
    var pbf = finalBreaks[b].asPageBreakItem();
    var goto = pbf.getGoToPage();
    var after = goto ? ('go to "' + goto.getTitle() + '"')
                     : String(pbf.getPageNavigationType());
    Logger.log('  ' + (b + 2) + '. ' + pbf.getTitle());
    Logger.log('        after this section: ' + after +
               (isLast ? '   (last section)' : ''));
    if (!isLast && after === 'SUBMIT') {
      Logger.log('        ^^ WRONG: this section ends the form before the waiver.');
    }
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
  // NOTE: this has proved unreliable on at least one form, where getItems() reported the
  // waiver as already last while Forms rendered it fourth of five. If the live form still
  // ends on an entry section after running this, move the waiver by hand in the editor.
  // Runnable on its own from the editor's dropdown, not just from updateExistingForm.
  form = form || openLiveForm();
  var items = form.getItems();
  var start = -1;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getType() === FormApp.ItemType.PAGE_BREAK &&
        isWaiverTitle(items[i].getTitle())) {
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
  Logger.log('Moved the waiver block (' + count + ' items) to the end of the form.');
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
      if (isWaiverTitle(breaks[i].getTitle())) {
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
  var form = openLiveForm();
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
    // CONTINUE is correct for the section sitting directly before the waiver.
    var continuesIntoWaiver =
      pb.getPageNavigationType() === FormApp.PageNavigationType.CONTINUE &&
      b + 1 < breaks.length && breaks[b + 1].getTitle() === PAGE.disclaimer;
    if (!isWaiver && !continuesIntoWaiver &&
        (!target || target.getTitle() !== PAGE.disclaimer)) {
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
  var rulesTick = null;
  var boxes = form.getItems(FormApp.ItemType.CHECKBOX);
  for (var k = 0; k < boxes.length; k++) {
    if (boxes[k].getTitle() === 'Agreement') agreement = boxes[k].asCheckboxItem();
    if (boxes[k].getTitle() === RULES_TICK_TITLE) rulesTick = boxes[k].asCheckboxItem();
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
  if (!rulesTick) {
    problems.push('the final page has no "' + RULES_TICK_TITLE + '" tick box');
  } else if (!rulesTick.isRequired()) {
    problems.push('the "' + RULES_TICK_TITLE + '" tick box is not required');
  } else {
    Logger.log('RULES: "' + RULES_TICK_TITLE + '" tick box present and required.');
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
// Closing date
// ---------------------------------------------------------------------------

/**
 * Forms has no built-in closing date. Run installCloseTrigger() ONCE and the form stops
 * accepting responses at EVENT.closesAt. Re-running replaces the earlier trigger rather
 * than stacking a second one.
 */
function installCloseTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'closeRegistration') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('closeRegistration').timeBased().at(EVENT.closesAt).create();
  Logger.log('Registration will close at ' + EVENT.closesAt.toString());
}

function closeRegistration() {
  var form = openLiveForm();
  form.setCustomClosedFormMessage(
    'Registration for ' + EVENT.name + ' closed on ' + EVENT.closingDate + '. ' +
    'Questions: ' + EVENT.contact
  );
  form.setAcceptingResponses(false);
  Logger.log('Registration closed.');
}

// ---------------------------------------------------------------------------
// Category caps, enforced against the response sheet
// ---------------------------------------------------------------------------

/**
 * HOW IT WORKS
 *
 * The response sheet gets two columns the script manages, found by header so it does not
 * matter where they sit or what Forms inserts beside them:
 *
 *   Status              Entered | Waitlist | Withdrawn
 *   Status category     the category the Status was given for
 *
 * Every new submission is stamped Entered if its category has room, Waitlist if not. A
 * category is offered on the form only while it has room AND nobody is waiting for it —
 * a freed slot goes to the waitlist first, not to whoever opens the form next.
 *
 * WHAT THE ORGANISER DOES IN THE SHEET
 *
 *   Someone drops out or never pays   set their Status to Withdrawn
 *   Promote someone off the waitlist  set their Status to Entered (earliest row first)
 *   Change a cap                      edit CATEGORIES, paste, run updateExistingForm()
 *
 * Editing a Status cell re-checks the caps straight away, so a category reopens on its
 * own once its slots are free and its waitlist is empty.
 *
 * Why a waitlist and not a hard stop: a respondent who loaded the form before the last
 * slot went can still submit into it. Forms cannot reject that, so the overflow is
 * caught here instead of silently taking an entry that cannot be honoured.
 *
 * SETUP: run installSheetTriggers() ONCE. It also stamps any existing responses.
 */

var STATUS = { entered: 'Entered', waitlist: 'Waitlist', withdrawn: 'Withdrawn' };
var STATUS_HEADER = 'Status';
var STATUS_CATEGORY_HEADER = 'Status category';

function installSheetTriggers() {
  var form = openLiveForm();
  var sheet = responseSheet(form);
  var spreadsheet = sheet.getParent();

  // Replace, never stack: two submit triggers would stamp every entry twice.
  var handlers = ['onEntrySubmitted', 'onStatusEdited'];
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (handlers.indexOf(triggers[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('onEntrySubmitted').forSpreadsheet(spreadsheet).onFormSubmit().create();
  ScriptApp.newTrigger('onStatusEdited').forSpreadsheet(spreadsheet).onEdit().create();

  var cols = statusColumns(sheet);
  var lastRow = sheet.getLastRow();
  for (var row = 2; row <= lastRow; row++) allocateRow(sheet, cols, row);

  updateCategoryAvailability(form);
  Logger.log('Triggers installed on ' + spreadsheet.getUrl());
}

/** Spreadsheet form-submit trigger. Also fires when a respondent edits their entry. */
function onEntrySubmitted(e) {
  withLock(function () {
    var form = openLiveForm();
    var sheet = e.range.getSheet();
    allocateRow(sheet, statusColumns(sheet), e.range.getRow());
    updateCategoryAvailability(form);
  });
}

/** Spreadsheet edit trigger. Only a Status change can free or take a slot. */
function onStatusEdited(e) {
  var sheet = e.range.getSheet();
  if (e.range.getRow() === 1 || sheet.getFormUrl() === null) return;
  var cols = statusColumns(sheet);
  if (e.range.getColumn() > cols.status || e.range.getLastColumn() < cols.status) return;
  withLock(function () {
    updateCategoryAvailability(openLiveForm());
  });
}

/**
 * Two entries landing in the same second would otherwise both count the same free slot,
 * and the category would end one over its cap.
 */
function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}

/** The tab Forms writes to, inside the spreadsheet the form is linked to. */
function responseSheet(form) {
  var id;
  try {
    id = form.getDestinationId();
  } catch (err) {
    throw new Error('The form has no response sheet. In the form: Responses → Link to Sheets.');
  }
  var linked = SpreadsheetApp.openById(id).getSheets().filter(function (sheet) {
    return sheet.getFormUrl() !== null;
  });
  if (linked.length === 1) return linked[0];
  for (var i = 0; i < linked.length; i++) {
    if (linked[i].getFormUrl().indexOf(form.getId()) !== -1) return linked[i];
  }
  throw new Error('Could not tell which tab holds this form’s responses.');
}

/** 1-based column numbers, adding the two managed columns on first use. */
function statusColumns(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  function find(header, create, note) {
    var index = headers.indexOf(header);
    if (index !== -1) return index + 1;
    if (!create) throw new Error('Column "' + header + '" not found in the response sheet.');
    headers.push(header);
    sheet.getRange(1, headers.length).setValue(header).setNote(note);
    return headers.length;
  }
  var cols = {
    category: find(CATEGORY_QUESTION, false),
    status: find(STATUS_HEADER, true,
      'Entered = has a place. Waitlist = category was full when they submitted. ' +
      'Withdrawn = set by hand when someone drops out or does not pay; frees the place.'),
    statusCategory: find(STATUS_CATEGORY_HEADER, true,
      'Managed by the script — do not edit. The category the Status was given for, so an ' +
      'entrant who edits their response into another category is re-queued.'),
  };
  // Bookkeeping only; hidden so nobody mistakes it for something to fill in.
  sheet.hideColumns(cols.statusCategory);
  var validation = SpreadsheetApp.newDataValidation()
    .requireValueInList([STATUS.entered, STATUS.waitlist, STATUS.withdrawn], true)
    .build();
  sheet.getRange(2, cols.status, sheet.getMaxRows() - 1, 1).setDataValidation(validation);
  return cols;
}

/**
 * Gives one row its Status. Rows already stamped keep it, unless the respondent edited
 * their entry into a different category — then they queue for the new one like anyone.
 */
function allocateRow(sheet, cols, row) {
  var values = sheet.getDataRange().getValues();
  var current = values[row - 1];
  var category = current[cols.category - 1];
  var status = current[cols.status - 1];
  if (!category || status === STATUS.withdrawn) return;
  if (status && current[cols.statusCategory - 1] === category) return;

  var cap = capFor(category);
  var taken = 0;
  for (var r = 1; r < values.length; r++) {
    if (r === row - 1) continue;
    if (values[r][cols.category - 1] === category &&
        values[r][cols.status - 1] === STATUS.entered) taken += 1;
  }
  var result = cap === null || taken < cap ? STATUS.entered : STATUS.waitlist;
  sheet.getRange(row, cols.status).setValue(result);
  sheet.getRange(row, cols.statusCategory).setValue(category);
}

function capFor(label) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].label === label) return CATEGORIES[i].cap;
  }
  return null; // A label from an older version of the form — not capped.
}

/**
 * Offers each category only while it has room and no waitlist. Closes the form when all
 * three are full, and reopens it if a slot frees before the closing date.
 */
function updateCategoryAvailability(form) {
  form = form || openLiveForm();
  var categoryItem = findMultipleChoice(form, CATEGORY_QUESTION);
  if (!categoryItem) throw new Error('Category question not found — was it renamed?');

  var sheet = responseSheet(form);
  var cols = statusColumns(sheet);

  // Stamp any row still without a Status — entries from before installSheetTriggers(), or
  // one a trigger missed. Unstamped rows would otherwise not count against the cap.
  var values = sheet.getDataRange().getValues();
  var stamped = 0;
  for (var u = 1; u < values.length; u++) {
    if (values[u][cols.category - 1] && !values[u][cols.status - 1]) {
      allocateRow(sheet, cols, u + 1);
      stamped += 1;
    }
  }
  if (stamped) {
    Logger.log('Gave a Status to ' + stamped + ' entries that had none.');
    values = sheet.getDataRange().getValues();
  }

  var tally = {};
  for (var r = 1; r < values.length; r++) {
    var label = values[r][cols.category - 1];
    var status = values[r][cols.status - 1];
    tally[label] = tally[label] || { entered: 0, waitlist: 0 };
    if (status === STATUS.entered) tally[label].entered += 1;
    if (status === STATUS.waitlist) tally[label].waitlist += 1;
  }

  // Page breaks are matched by title so the navigation survives a rebuild.
  var targets = {
    'U17_SINGLES': PAGE.singles,
    'U17_DOUBLES': PAGE.u17Doubles,
    'ADULT_OPEN': PAGE.adults,
  };
  var pages = {};
  var breaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  for (var p = 0; p < breaks.length; p++) pages[breaks[p].getTitle()] = breaks[p].asPageBreakItem();

  var choices = [];
  var full = [];
  var report = [];
  for (var c = 0; c < CATEGORIES.length; c++) {
    var cat = CATEGORIES[c];
    var count = tally[cat.label] || { entered: 0, waitlist: 0 };
    report.push(cat.label + ': ' + count.entered + '/' + cat.cap + ' ' + cat.unit +
                (count.waitlist ? ', ' + count.waitlist + ' waiting' : ''));
    if (count.entered >= cat.cap || count.waitlist > 0) {
      full.push(cat.label);
      continue;
    }
    choices.push(categoryItem.createChoice(cat.label, pages[targets[cat.key]]));
  }

  categoryItem.setHelpText(categoryHelpText(full));
  if (choices.length === 0) {
    form.setCustomClosedFormMessage(
      'Every category of ' + EVENT.name + ' is full. Questions: ' + EVENT.contact
    );
    form.setAcceptingResponses(false);
  } else {
    // setChoices rejects an empty list, which is why the all-full case leaves them be.
    categoryItem.setChoices(choices);
    if (!form.isAcceptingResponses() && new Date() < EVENT.closesAt) {
      form.setAcceptingResponses(true);
    }
  }
  for (var k = 0; k < report.length; k++) Logger.log('  ' + report[k]);
  Logger.log(choices.length + ' of ' + CATEGORIES.length + ' categories open.');
}
