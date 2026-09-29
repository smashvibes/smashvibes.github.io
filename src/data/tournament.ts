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
import guest1 from '../assets/tournament/guest-1.jpg';
import guest2 from '../assets/tournament/guest-2.jpg';
import guest3 from '../assets/tournament/guest-3.jpg';
import guest4 from '../assets/tournament/guest-4.jpg';

/**
 * Where every "Register Now" button points.
 *
 * Paste the Google Form's published URL here (the /viewform one, not /edit) and every
 * CTA on the page switches over — nav, hero and the closing band. Build the form by
 * running scripts/create-registration-form.gs; until a URL is set, the buttons fall
 * back to the WhatsApp chat so they are never dead.
 */
export const REGISTRATION_FORM_URL = '';

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

export const tournamentNav: { label: string; href: string; active?: boolean }[] = [
  { label: 'Home', href: '#top', active: true },
  { label: 'About', href: '#about' },
  { label: 'Event Details', href: '#details' },
  { label: 'Categories', href: '#categories' },
  { label: 'Sponsors', href: '#sponsors' },
  /**
   * No tournament-specific FAQ copy was supplied, so this points at the Smash Vibes FAQ
   * rather than at an invented section. Give it its own once the questions exist.
   */
  { label: 'FAQ', href: '/#faq' },
];

export const hero = {
  image: heroImage,
  imageAlt: 'A badminton player reaching for a return at full stretch under the hall lights',
  facts: [
    { icon: 'calendar' as IconName, value: '14 November 2026', note: '(Saturday)' },
    { icon: 'clock' as IconName, value: '10:00 AM – 3:00 PM', note: '(5 Hours)' },
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
        { icon: 'bracket', text: 'Knockout stage' },
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
        { icon: 'bracket', text: 'Round-robin stage' },
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
    { icon: 'users', label: 'Open Adult Category:', text: '2 groups of 5 pairs' },
    { icon: 'calendar', text: 'Event held twice a year' },
    { icon: 'calendar', label: 'Next event planned:', text: 'June at SBH Expo' },
  ] satisfies SpecRow[],
  venue: {
    name: 'SBH VIP Hall @ Sims',
    lines: ['Singapore Badminton Hall (SBH) @ Sims,', '1 Lorong 23 Geylang, Singapore 388352'],
    image: venueImage,
    imageAlt: 'The green courts of SBH VIP Hall, lit and empty before the tournament',
  },
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
  eyebrow: 'Special guests',
  title: 'Meet Our Featured Guests',
  items: [
    { name: 'Alison Tan', role: 'World Ranking Player', photo: guest1 },
    { name: 'Chloe Lim', role: 'Former National Player', photo: guest2 },
    { name: 'Marcus Ong', role: 'National Coach', photo: guest3 },
    { name: 'Jin Yujia', role: 'Award Presenter', photo: guest4 },
  ],
};

export const closing = {
  title: 'Secure Your Spot Now',
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
