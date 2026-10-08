/**
 * StarRise Cup — all copy, links and imagery for /tournament.
 *
 * A separate event brand run in collaboration with Smash Vibes, so it keeps its own
 * wordmark and navigation while using the Smash Vibes design system for everything else.
 */
import type { IconName } from '../components/icons';
import { WHATSAPP_CHAT } from './site';

import heroImage from '../assets/tournament/hero.jpg';
import aboutImage from '../assets/tournament/about-shuttle.jpg';
import venueImage from '../assets/tournament/venue.jpg';
import guest4 from '../assets/tournament/guest-4.jpg';

/**
 * Where every "Register Now" button points.
 *
 * The Google Form's published URL (the /viewform one, not /edit). Every CTA on the page
 * reads from it — nav, hero and the closing band. Rebuild the form with
 * scripts/create-registration-form.gs; if this is ever emptied, the buttons fall back to
 * the WhatsApp chat rather than going dead.
 *
 * Form edit URL, for the organiser:
 *   https://docs.google.com/forms/d/1YNtTzgFumfKaYvcaKYQaUV1p-gbDuT8Q6vwOgKCwBS4/edit
 * Responses:
 *   https://docs.google.com/spreadsheets/d/1RGpG_7xmVjjLCT11hziGWlupfc2OSGPb7lOhJcAe6tg/edit
 */
export const REGISTRATION_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd1RCb3B_Uh3udfJ4rNhDTvblKMZ4sRynsKPizbVibVU-OHwA/viewform';

export const REGISTER_URL = REGISTRATION_FORM_URL || WHATSAPP_CHAT;

export const tournament = {
  name: 'StarRise Cup',
  logo: '/tournament/starrise-cup-logo.png',
  title: 'StarRise Cup 2026 | Badminton Tournament in Singapore',
  description:
    'StarRise Cup badminton tournament, 14 November 2026 at SBH VIP Hall @ Sims, Singapore. Teens and adults categories, prizes up to $600. In collaboration with Smash Vibes.',
  collaboration: 'In collaboration with Smash Vibes',
  tagline: ['Compete', 'Rise', 'Connect'],
  /** The middle word is set in gold, as in the design. */
  taglineAccentIndex: 1,
  registerLabel: 'Register Now',
};

/**
 * Absolute paths, not bare anchors: the same nav renders on /tournament/ and on
 * /tournament/draws/, and "#about" from the draws page would go nowhere.
 */
export const tournamentNav: { label: string; href: string }[] = [
  { label: 'Home', href: '/tournament/' },
  { label: 'Draws', href: '/tournament/draws/' },
  { label: 'Live', href: '/tournament/live/' },
];

/**
 * The way out. StarRise Cup is a sub-site, so without this the only route back to Smash
 * Vibes is the browser's Back button — which does not exist for someone who arrived on
 * the tournament page from a shared link.
 */
export const backToMain = { label: 'Smash Vibes', href: '/' };

/** Footer links, covering the sections the short nav no longer lists. */
export const tournamentFooterNav: { label: string; href: string; target?: string }[] = [
  { label: 'Home', href: '/tournament/' },
  { label: 'About', href: '/tournament/#about' },
  { label: 'Categories', href: '/tournament/#categories' },
  { label: 'Prizes', href: '/tournament/#prizes' },
  { label: 'Event Details', href: '/tournament/#details' },
  { label: 'Draws', href: '/tournament/draws/' },
  { label: 'Live', href: '/tournament/live/' },
  { label: 'Sponsors', href: '/tournament/#sponsors' },
  // Straight to the image: there is no poster section on the page to link to.
  { label: 'Event Poster', href: '/tournament/starrise-cup-poster.jpg', target: '_blank' },
];

export const hero = {
  image: heroImage,
  imageAlt: 'A badminton player reaching for a return at full stretch under the hall lights',
  facts: [
    { icon: 'calendar' as IconName, value: '14 November 2026', note: '(Saturday)' },
    { icon: 'clock' as IconName, value: '10:00 AM – 5:00 PM', note: '(7 Hours)' },
  ],
  venue: {
    icon: 'pin' as IconName,
    name: 'SBH VIP Hall @ Sims',
    lines: ['Singapore Badminton Hall (SBH) @ Sims,', '1 Lorong 23 Geylang, Singapore 388352'],
  },
};

export const about = {
  eyebrow: 'About the tournament',
  title: 'More Than Just a Game',
  body: [
    'The StarRise Cup brings together competitive youth players and social / recreational adult players for a well-organised badminton experience at SBH VIP Hall @ Sims.',
    'Expect quality matches, a welcoming atmosphere, and a chance to compete, connect, and grow.',
  ],
  image: aboutImage,
  imageAlt: 'Close-up of a feather shuttlecock resting on a court',
};

export interface SpecRow {
  icon: IconName;
  /** Bold prefix, e.g. "Semi Finals:". Omit for a plain line. */
  label?: string;
  text: string;
}

export const categories = {
  eyebrow: 'Competition categories',
  title: 'Two Categories, One Great Event',
  items: [
    {
      title: 'Teens Category',
      subtitle: 'For players under 17 years old',
      rows: [
        { icon: 'users', label: 'Events:', text: 'Singles & Doubles' },
        { icon: 'bracket', text: 'Round-robin groups, then knockout' },
        { icon: 'shuttlecock', label: 'Matches:', text: 'first to 30 points' },
        { icon: 'chart', label: 'Semi Finals:', text: 'Best of 3 sets, 21 points' },
        { icon: 'trophy', label: 'Finals:', text: 'Best of 3 sets, 21 points' },
        {
          icon: 'rules',
          text: 'Current Junior National or any form of representation to their own respective country is not allowed.',
        },
      ] satisfies SpecRow[],
    },
    {
      title: 'Adults Category',
      subtitle: 'Targeted towards the social / recreational badminton community',
      rows: [
        { icon: 'users', text: 'National-level / state-level players are not eligible' },
        { icon: 'shuttlecock', label: 'Events:', text: "Men's Doubles & Mixed Doubles combined" },
        { icon: 'bracket', text: 'Round-robin groups, then knockout' },
        { icon: 'chart', label: 'Semi Finals:', text: '3 sets of 21 points' },
        { icon: 'trophy', label: 'Finals:', text: '3 sets of 21 points' },
      ] satisfies SpecRow[],
    },
  ],
};

export const prizes = {
  eyebrow: 'Prizes',
  title: 'Attractive Prizes',
  items: [
    {
      title: 'Singles Under 17',
      first: [
        { label: '1st Prize:', value: '$500' },
        { label: 'Student:', value: '$500' },
        { label: 'Coach:', value: '$500' },
      ],
      second: { label: '2nd Prize:', value: '$250' },
    },
    {
      title: 'Doubles Under 17',
      first: [
        { label: '1st Prize:', value: '$600' },
        { label: 'Student:', value: '$600' },
        { label: 'Coach:', value: '$500' },
      ],
      second: { label: '2nd Prize:', value: '$350' },
    },
    {
      title: 'Adults Doubles',
      first: [{ label: '1st Prize:', value: '$600' }],
      second: { label: '2nd Prize:', value: '$350' },
    },
  ],
};

export const details = {
  eyebrow: 'Tournament details',
  title: 'Key Information',
  rows: [
    { icon: 'users', label: 'Under 17 Singles:', text: '16 entries' },
    { icon: 'users', label: 'Under 17 Doubles:', text: '16 pairs' },
    { icon: 'users', label: 'Open Adult Category:', text: '16 pairs' },
    { icon: 'calendar', text: 'Event held twice a year' },
    { icon: 'calendar', label: 'Next event planned:', text: 'June at SBH Expo' },
  ] satisfies SpecRow[],
  venue: {
    name: 'SBH VIP Hall @ Sims',
    lines: ['Singapore Badminton Hall (SBH) @ Sims,', '1 Lorong 23 Geylang, Singapore 388352'],
    image: venueImage,
    imageAlt: 'The green courts of SBH VIP Hall @ Sims under full lighting',
  },
};

/**
 * Event poster, reached from the footer only.
 *
 * It lives in public/ rather than going through the asset pipeline because the link is
 * opened directly and shared around; a hashed URL would change on every re-export and
 * break anything already sent out.
 */
export const poster = {
  file: '/tournament/starrise-cup-poster.jpg',
};

/** Live scoreboard. The matches come from the same sheet as the draws. */
export const live = {
  title: 'Live',
  note: 'Matches in progress, what is up next and the latest results, straight from the match desk. Scores update automatically on match day.',
};

export const sponsors = {
  eyebrow: 'Sponsors',
  title: 'Supported By',
  /** TODO: add each sponsor's website as `href` so the logos link out. */
  items: [
    { name: 'Global Barrels', logo: '/tournament/sponsor-global-barrels.png' },
    { name: 'Fresh Cars', logo: '/tournament/sponsor-fresh-cars.png' },
    { name: 'Athens', logo: '/tournament/sponsor-athens.png' },
    { name: 'Li-Ning Sports Singapore', logo: '/tournament/sponsor-li-ning.png' },
    { name: 'Smphony Music School', logo: '/tournament/sponsor-smphony.png' },
  ],
};

export const guests = {
  eyebrow: 'Special guest',
  title: 'Meet Our Featured Guest',
  items: [{ name: 'Jin Yujia', role: 'Award Presenter', photo: guest4 }],
};

export const closing = {
  title: 'Secure Your Spot Now',
};

export interface Draw {
  id: string;
  label: string;
  meta: string;
  icon: IconName;
}

/**
 * The three draws. Which categories exist, in tab order, with their labels — the content
 * of each (names, courts, times, scores) comes from the organiser's sheet via
 * src/data/draws.json; see src/data/draws.ts. The `id` is the key into that file and
 * must match EVENTS in scripts/draws-sheet.gs.
 *
 * Every category runs four groups of four, and the top two of each group go into the
 * quarter finals.
 */
export const draws: {
  eyebrow: string;
  title: string;
  note: string;
  formatNote: string;
  updatedLabel: string;
  /** The state pills, explained once at the top of the page. */
  legend: { live: string; done: string; upcoming: string };
  /** Full-screen mode for the hall TV: chrome hidden, everything scaled up. */
  tv: { enter: string; exit: string; hint: string };
  stages: { groups: string; knockout: string };
  items: Draw[];
} = {
  eyebrow: 'Tournament draws',
  title: 'Draws',
  note: 'Every category plays four round-robin groups of four, with the top two in each group going through to the quarter finals. Names appear here once the draw is made, and scores update automatically on match day.',
  formatNote: 'Scores and the knockout line-up are kept by the match desk; what they record is what you see here.',
  updatedLabel: 'Last updated',
  legend: { live: 'Live', done: 'Done', upcoming: 'Upcoming' },
  tv: { enter: 'TV mode', exit: 'Exit TV mode', hint: 'Press Esc to exit' },
  stages: { groups: 'Round Robin', knockout: 'Knockout Draw' },
  items: [
    { id: 'u17-singles', label: 'U17 Singles', meta: '16 entries', icon: 'user' },
    { id: 'u17-doubles', label: 'U17 Doubles', meta: '16 pairs', icon: 'users' },
    { id: 'open-doubles', label: 'Open Doubles', meta: '16 pairs', icon: 'users-plus' },
  ],
};

/**
 * TODO: no social handles were supplied. Fill in `href` and each icon becomes a link;
 * until then they render as muted marks rather than links to nowhere.
 */
export const socials: { icon: IconName; label: string; href: string | null }[] = [
  { icon: 'instagram', label: 'Instagram', href: null },
  { icon: 'tiktok', label: 'TikTok', href: null },
  { icon: 'facebook', label: 'Facebook', href: null },
  { icon: 'youtube', label: 'YouTube', href: null },
];
