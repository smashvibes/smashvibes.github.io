/**
 * All site copy and links in one place.
 *
 * Content lives here rather than inline in the templates so non-technical edits
 * (a venue change, a new price) are a one-file diff that never touches markup.
 */
import type { IconName } from '../components/icons';

/**
 * Photographs are imported (not referenced by URL) so Astro's asset pipeline can hash,
 * convert and generate a responsive srcset for each one at build time. To swap a photo,
 * replace the file in src/assets/images/ keeping its name.
 */
import heroImage from '../assets/images/hero-player.jpg';
import venueImage from '../assets/images/venue-courts.jpg';
import ctaImage from '../assets/images/cta-racket.jpg';
import community1 from '../assets/images/community-1.jpg';
import community2 from '../assets/images/community-2.jpg';
import community3 from '../assets/images/community-3.jpg';
import community4 from '../assets/images/community-4.jpg';

/** Primary WhatsApp contact. Singapore number, country code 65, no spaces. */
export const WHATSAPP_NUMBER = '9683 4290';
export const WHATSAPP_CHAT = `https://wa.me/65${WHATSAPP_NUMBER.replace(/\s/g, '')}`;

/** The community group. Every "Join WhatsApp Group" button points here. */
export const WHATSAPP_GROUP = 'https://chat.whatsapp.com/CDLawr1pluT96IpcaQL4Ur';

/** Where "Join a Game" points. Swap for a form/booking URL when one exists. */
export const JOIN_URL = WHATSAPP_CHAT;

export const site = {
  name: 'Smash Vibes',
  /** 48 characters — primary keyword first, brand last. Keep under 60. */
  title: 'Weekly Badminton Games in Singapore | Smash Vibes',
  /** 157 characters. Keep under 160 so it is not truncated in results. */
  description:
    'Join friendly, level-matched badminton games in Singapore every Monday and Wednesday, 12-2PM at SBH Premier Courts, Geylang. $10 per game, all levels welcome.',
  url: 'https://www.smashvibes.sg',
  locale: 'en_SG',
  /** Absolute path (served from public/) — social crawlers need a stable, un-hashed URL. */
  ogImage: '/images/og-cover.jpg',
  ogImageAlt: 'A Smash Vibes player leaping for an overhead smash, with the session details',
};

/**
 * Search terms this page targets, most important first. These are chosen from how
 * Singapore players actually describe the thing ("badminton kaki", "pay per game"),
 * not from volume data — validate them in Search Console once the site has traffic,
 * and adjust the copy rather than adding a keywords meta tag (search engines ignore it).
 *
 *   badminton Singapore · badminton games Singapore · social badminton Singapore
 *   casual badminton Singapore · badminton community Singapore · badminton kaki
 *   badminton for beginners Singapore · badminton session Geylang
 *   Singapore Badminton Hall · $10 badminton Singapore · weekly badminton Singapore
 */

/** `Tournaments` leaves the page — it is the only cross-page link in the nav. */
export const nav: { label: string; href: string; active?: boolean }[] = [
  { label: 'Home', href: '#top', active: true },
  { label: 'Our Games', href: '#games' },
  { label: 'About', href: '#about' },
  { label: 'Community', href: '#community' },
  { label: 'Tournaments', href: '/tournament/' },
  { label: 'FAQ', href: '#faq' },
];

export const hero = {
  eyebrow: "Singapore's Badminton Community",
  titleLines: ['Play • Connect', 'Good Vibes'],
  lede: 'Weekly badminton games for all levels. Meet new friends, enjoy great matches, and be part of a growing badminton community in Singapore.',
  image: heroImage,
  imageAlt: 'A Smash Vibes player leaping for an overhead smash under the court lights',
  stats: [
    { icon: 'users', label: 'All levels welcome' },
    { icon: 'shuttlecock', label: 'Quality shuttles' },
    { icon: 'dollar', label: '$10', sub: 'per game' },
    { icon: 'community', label: 'Friendly community' },
  ] satisfies { icon: IconName; label: string; sub?: string }[],
};

export const schedule = {
  eyebrow: 'Our weekly games',
  days: 'Every Monday & Wednesday',
  time: '12:00 PM – 2:00 PM',
  venue: 'SBH Premier Courts',
};

export const venue = {
  name: 'SBH Premier Courts',
  building: 'Singapore Badminton Hall (SBH) @ Sims',
  address: '1 Lorong 23 Geylang, Singapore 388352',
  mapUrl: 'https://maps.google.com/?q=Singapore+Badminton+Hall,+1+Lorong+23+Geylang,+Singapore+388352',
  image: venueImage,
  imageAlt: 'Players rallying across the grey and red courts at SBH Premier Courts',
  points: [
    'Premium badminton courts',
    'Comfortable indoor environment',
    'Convenient location',
    'Easy access by MRT and bus',
  ],
};

/** Lede under the features heading. Carries the primary keywords in natural prose. */
export const featuresIntro =
  'Smash Vibes runs social badminton games in Singapore for players of every level — from people picking up a racket again to regulars chasing a good rally. Here is what a session with us looks like.';

export const features: { icon: IconName; title: string; titleSub?: string; body: string }[] = [
  {
    icon: 'users',
    title: 'Level-Matched Games',
    body: 'Play with players of similar skill levels for better and more enjoyable matches.',
  },
  {
    icon: 'dollar',
    title: '$10',
    titleSub: 'per game',
    body: 'Pay-as-you-play. Just $10 per game with no hidden costs. Play great badminton without breaking the bank.',
  },
  {
    icon: 'shuttlecock',
    title: 'Quality Shuttles',
    body: 'We use high-quality shuttles like RSL Supreme for a better playing experience.',
  },
  {
    icon: 'video',
    title: 'Game Recording',
    body: 'Selected games can be recorded and sent to you after the session. Review your rallies, keep memories or share your best clips.',
  },
  {
    icon: 'community',
    title: 'Friendly Community',
    body: 'Meet new friends, expand your network and be part of a growing badminton community in Singapore.',
  },
];

export const highlights: { icon: IconName; label: string }[] = [
  { icon: 'users', label: 'All levels welcome' },
  { icon: 'shuttlecock', label: 'Regular weekly games' },
  { icon: 'connect', label: 'Play • Connect Good Vibes' },
];

export const community = {
  eyebrow: 'Our community',
  title: 'Games • Friends • Good Vibes',
  ctaLabel: 'View More Photos',
  ctaHref: WHATSAPP_GROUP,
  photos: [
    { src: community1, alt: 'The Smash Vibes group photographed together on court after a session' },
    { src: community2, alt: 'A doubles rally in play during a weekly Smash Vibes game' },
    { src: community3, alt: 'A row of feather shuttlecocks ready for the session' },
    { src: community4, alt: 'Four players smiling together courtside' },
  ],
};

/**
 * Contact channels. Singapore numbers are given in wa.me form (country code 65, no
 * spaces) so the links open a chat directly rather than just displaying a number.
 */
export const contacts = {
  whatsapp: [
    { label: '8947 7476', href: 'https://wa.me/6589477476' },
    { label: '9683 4290', href: 'https://wa.me/6596834290' },
  ],
  telegram: [
    { label: '@smash_vibes', href: 'https://t.me/smash_vibes' },
    { label: '@ellxyry', href: 'https://t.me/ellxyry' },
  ],
};

/** Answers are authored HTML so one of them can carry the contact links. */
export const faq = {
  eyebrow: 'Good to know',
  title: 'Frequently Asked Questions',
  items: [
    {
      q: 'When and where are Smash Vibes games held?',
      a: 'Our regular games are held every Monday and Wednesday, from 12:00 PM to 2:00 PM, at <a href="#about">SBH Premier Courts</a>, Singapore Badminton Hall @ Sims, 1 Lorong 23 Geylang, Singapore 388352.',
    },
    {
      q: 'How much does each game cost?',
      a: 'Each session is only $10 per player, paid as you play with no membership and no hidden costs. See <a href="#why">what is included</a>.',
    },
    {
      q: 'What badminton level do I need to join?',
      a: 'Players of different levels are welcome, including beginners. We <a href="#why">match players</a> with others of a similar standard so everyone can enjoy more balanced and enjoyable games.',
    },
    {
      q: 'How do I register or reserve a slot for a game?',
      a: 'Simply contact us via WhatsApp at <a href="https://wa.me/6589477476" target="_blank" rel="noopener noreferrer">8947 7476</a> / <a href="https://wa.me/6596834290" target="_blank" rel="noopener noreferrer">9683 4290</a>, or Telegram at <a href="https://t.me/smash_vibes" target="_blank" rel="noopener noreferrer">@smash_vibes</a> / <a href="https://t.me/ellxyry" target="_blank" rel="noopener noreferrer">@ellxyry</a>.',
    },
    {
      q: 'What happens if I register but cannot make it?',
      a: 'Please let us know as early as possible so we can offer the slot to another player. Any cancellation or payment policy will be communicated when you book.',
    },
    {
      q: 'What shuttlecocks do you use during the games?',
      a: 'We use quality shuttlecocks such as RSL Supreme to provide a better playing experience.',
    },
    {
      q: 'How are players matched during each session?',
      a: 'We arrange games based on player level where possible, so players can enjoy competitive and balanced matches with different people throughout the session.',
    },
    {
      q: 'Are the games competitive or more social?',
      a: 'Both. Smash Vibes is designed to be friendly and social, while still giving players a chance to enjoy good-quality and competitive badminton.',
    },
    {
      q: 'Will my games be recorded, and can I receive the video afterwards?',
      a: 'Yes, selected games may be recorded. Players can request the footage afterwards to review their game, keep as a memory, or share their best rallies.',
    },
    {
      q: 'Do I need to join the WhatsApp group to participate?',
      a: 'It is not compulsory, but we highly recommend joining. The group is where we share upcoming game slots, updates, announcements and other Smash Vibes activities. <a href="#join">Join a game</a> to get started.',
    },
  ],
};

export const closing = {
  eyebrow: 'Ready to play?',
  title: 'Join Smash Vibes Today',
  lede: "Be part of Singapore's growing badminton community.",
  image: ctaImage,
};
