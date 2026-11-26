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
import guest5 from '../assets/tournament/guest-5.jpg';
import galleryData from './gallery.json';

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
 * The page's one call to action. Registration closed with the event on 14 Nov 2026, so
 * every button that said "Register Now" — nav, hero and the closing band — now points at
 * the photos. REGISTER_URL stays for the record and for llms.txt.
 */
export const GALLERY_HREF = '/tournament/gallery/';
export const cta = { label: 'View Photos', href: GALLERY_HREF };

/**
 * Absolute paths, not bare anchors: the same nav renders on /tournament/ and on
 * /tournament/draws/, and "#about" from the draws page would go nowhere.
 */
export const tournamentNav: { label: string; href: string }[] = [
  { label: 'Home', href: '/tournament/' },
  { label: 'Draws', href: '/tournament/draws/' },
  { label: 'Gallery', href: GALLERY_HREF },
  // Live is built but hidden for now: src/pages/tournament/_live.astro. Rename it back
  // to live.astro and add { label: 'Live', href: '/tournament/live/' } here and in the footer.
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
  { label: 'Highlights', href: '/tournament/#highlights' },
  { label: 'Gallery', href: GALLERY_HREF },
  { label: 'About', href: '/tournament/#about' },
  { label: 'Categories', href: '/tournament/#categories' },
  { label: 'Prizes', href: '/tournament/#prizes' },
  { label: 'Event Details', href: '/tournament/#details' },
  { label: 'Draws', href: '/tournament/draws/' },
  { label: 'Sponsors', href: '/tournament/#sponsors' },
  // Straight to the image: there is no poster section on the page to link to.
  { label: 'Event Poster', href: '/tournament/starrise-cup-poster.jpg', target: '_blank' },
];

export const hero = {
  image: heroImage,
  imageAlt: 'A badminton player reaching for a return at full stretch under the hall lights',
  facts: [
    { icon: 'calendar' as IconName, value: '14 November 2026', note: '(Saturday)' },
    { icon: 'clock' as IconName, value: '10:00 AM – 5:00 PM' },
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
    'StarRise Cup brings together competitive youth and adult players for a well-organised badminton event at SBH VIP Hall @ Sims. Expect quality matches and a welcoming atmosphere.',
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
  title: 'Three Categories, One Great Event',
  items: [
    {
      title: 'U-17 Singles Category',
      rows: [
        { icon: 'shuttlecock', label: 'Events:', text: 'Singles' },
        { icon: 'users', label: 'Matches:', text: '' },
        { icon: 'cap', text: 'Qualifiers – Group Round Robin Match 1st to 15 points' },
        { icon: 'chart', text: 'Quarterfinals – 1st to 15 points' },
        { icon: 'community', text: 'Semifinals – Best of 3 sets, 21 points' },
        { icon: 'trophy', text: 'Finals – Best of 3 sets, 21 points' },
      ] satisfies SpecRow[],
    },
    {
      title: 'U-17 Doubles Category',
      rows: [
        { icon: 'shuttlecock', label: 'Events:', text: 'Doubles' },
        { icon: 'users', label: 'Matches:', text: '' },
        { icon: 'cap', text: 'Qualifiers – Group Round Robin Match 1st to 15 points' },
        { icon: 'chart', text: 'Quarterfinals – 1st to 15 points' },
        { icon: 'community', text: 'Semifinals – Best of 3 sets, 21 points' },
        { icon: 'trophy', text: 'Finals – Best of 3 sets, 21 points' },
      ] satisfies SpecRow[],
    },
    {
      title: 'Adult Open Category',
      rows: [
        { icon: 'users', label: 'Matches:', text: 'Round robin Qualifiers' },
        { icon: 'cap', text: 'First to 15 points' },
        { icon: 'chart', text: 'Quarterfinals – first to 15 points' },
        { icon: 'community', text: 'Semifinals – best of 3 sets 21 points' },
        { icon: 'trophy', text: 'Finals – best of 3 sets 21 points' },
      ] satisfies SpecRow[],
    },
  ],
};

/**
 * Prize cards. `total` is the card's hero figure; `first` lists how the first prize is
 * split (student and coach for the junior events, one line for the adults); `second`
 * is pinned to the foot of the card.
 */
export const prizes = {
  eyebrow: 'Prizes',
  title: 'Attractive Prizes',
  items: [
    {
      title: 'Singles Under 17',
      total: { label: 'Total Prize:', value: '$1,250' },
      firstLabel: '1st Prize:',
      first: [
        { label: 'Student:', value: '$500' },
        { label: 'Coach:', value: '$500' },
      ],
      second: { label: '2nd Prize:', value: '$250' },
    },
    {
      title: 'Doubles Under 17',
      total: { label: 'Total Prize:', value: '$1,550' },
      firstLabel: '1st Prize:',
      first: [
        { label: 'Student:', value: '$700' },
        { label: 'Coach:', value: '$500' },
      ],
      second: { label: '2nd Prize:', value: '$350' },
    },
    {
      title: 'Adults Doubles',
      total: { label: 'Total Prize:', value: '$1,050' },
      firstLabel: '1st Prize:',
      first: [{ label: '1st Prize:', value: '$700' }],
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
    { icon: 'users', label: 'Adult Open Category:', text: '16 pairs' },
    { icon: 'calendar', text: 'Event held once a year' },
    { icon: 'calendar', label: 'Next planned event:', text: 'Tentative' },
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
  /**
   * In the mockup's order: a row of three, then a row of four. Logos are the sponsors'
   * own files, taken from their websites on 8 Oct 2026; a card with an `href` links out.
   *
   * Still unresolved — no website found, so the logo is a crop of the mockup and the
   * card does not link: 3W Logistics Pte Ltd (registered Dec 2025, no web presence) and
   * Athens (no company identified). T.E Engineering & Trading shows its name as text, by
   * the organiser's choice: no logo, no link.
   */
  items: [
    { name: 'Global Barrels', logo: '/tournament/sponsor-global-barrels.png', href: 'https://globalbarrels.com.sg/' },
    { name: 'Fresh Cars', logo: '/tournament/sponsor-fresh-cars.png', href: 'https://www.freshcars.sg/' },
    { name: 'T.E Engineering & Trading' },
    { name: 'Li-Ning Sports Singapore', logo: '/tournament/sponsor-li-ning.svg', href: 'https://sg.lining.studio/' },
    { name: 'Symphony Music School', logo: '/tournament/sponsor-symphony.png', href: 'https://symphonymusic888.com/' },
    { name: '3W Logistics Pte Ltd', logo: '/tournament/sponsor-3w-logistics.png' },
    { name: 'Athens', logo: '/tournament/sponsor-athens.png' },
  ] as { name: string; logo?: string; href?: string }[],
};

export const guests = {
  eyebrow: 'Special guests',
  title: 'Meet Our Featured Guests',
  items: [
    { name: 'Jin Yujia', role: 'Award Presenter', photo: guest4 },
    { name: '花花 hhua', role: 'Special Guest · AQ MCN Talent', photo: guest5 },
  ],
};

export const closing = {
  title: 'See You at the Next StarRise Cup',
};

/**
 * Highlight reel on the home page. The organiser's file is HEVC, which Chrome on Android
 * and Windows will not reliably play, so this is a 720p H.264 re-encode with the moov
 * atom up front (it starts before the whole file arrives). From the original:
 *
 *   ffmpeg -i "StarRise CUP.mp4" -vf "scale=720:-2,format=yuv420p" -c:v libx264 \
 *     -profile:v high -preset slow -crf 27 -c:a aac -b:a 128k -movflags +faststart \
 *     public/tournament/starrise-cup-highlights.mp4
 *   ffmpeg -ss 25 -i "StarRise CUP.mp4" -frames:v 1 -vf scale=720:-2 -q:v 4 \
 *     public/tournament/starrise-cup-highlights.jpg
 */
export const highlights = {
  eyebrow: 'Highlights',
  title: 'Relive StarRise Cup 2026',
  body: 'Thank you to every player, coach, guest and sponsor who made 14 November one to remember. Catch the best moments in the highlight reel, then find yourself in the gallery.',
  video: '/tournament/starrise-cup-highlights.mp4',
  poster: '/tournament/starrise-cup-highlights.jpg',
  width: 720,
  height: 1280,
  videoLabel: 'StarRise Cup 2026 highlight reel',
};

export interface GalleryPhoto {
  id: string;
  width: number;
  height: number;
}

/**
 * Photo albums. The frames and their sizes come from src/data/gallery.json, which
 * `npm run gallery:import` writes from the photographer's export; this list decides the
 * order, the titles and the copy. A slug missing from gallery.json is simply not shown.
 */
const albumCopy = [
  { slug: 'highlights', title: 'Tournament Highlights', description: 'Rallies, smashes and the action on court.' },
  { slug: 'winners', title: 'Winners & Runner-Ups', description: 'Champions, runners-up and their trophies.' },
  { slug: 'guests', title: 'Guests', description: 'Our special guests on the day.' },
  { slug: 'behind-the-scenes', title: 'Behind the Scenes', description: 'The organising team, officials and the opening briefing.' },
];

export const gallery = {
  eyebrow: 'Gallery',
  title: 'Tournament Photos',
  note: 'Every album from StarRise Cup 2026. Tap a photo to see it full size and save it to your phone.',
  backLabel: 'All albums',
  downloadLabel: 'Download',
  albums: albumCopy.flatMap((album) => {
    const photos = galleryData.albums.find((a) => a.slug === album.slug)?.photos as GalleryPhoto[] | undefined;
    return photos?.length ? [{ ...album, photos, cover: photos[0] }] : [];
  }),
};

export type GalleryAlbum = (typeof gallery.albums)[number];

/** The album pages and the image files share one path: /tournament/gallery/<slug>/. */
export const albumHref = (slug: string) => `${GALLERY_HREF}${slug}/`;
export const photoSrc = (slug: string, id: string) => `${GALLERY_HREF}${slug}/${id}.jpg`;
export const thumbSrc = (slug: string, id: string) => `${GALLERY_HREF}${slug}/${id}-thumb.webp`;
export const albumOgImage = (slug: string) => `${GALLERY_HREF}${slug}/og.jpg`;

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
  /**
   * The round robin is over, so since 26 Nov 2026 each draw shows only its knockout
   * bracket and the stage tabs are gone. Set back to true to bring the groups back.
   */
  showGroups: boolean;
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
  showGroups: false,
  items: [
    { id: 'u17-singles', label: 'U17 Singles', meta: '16 entries', icon: 'user' },
    { id: 'u17-doubles', label: 'U17 Doubles', meta: '16 pairs', icon: 'users' },
    { id: 'open-doubles', label: 'Open Doubles', meta: '16 pairs', icon: 'users-plus' },
  ],
};

/** Same profiles as the main site; the tournament has no accounts of its own. */
export { socials } from './site';
