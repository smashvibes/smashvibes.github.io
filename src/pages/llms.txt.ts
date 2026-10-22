import type { APIRoute } from 'astro';
import { site, schedule, venue, features, faq, contacts, socials, WHATSAPP_GROUP } from '../data/site';
import {
  tournament,
  hero as tournamentHero,
  categories,
  prizes,
  details,
  sponsors,
  REGISTRATION_FORM_URL,
} from '../data/tournament';

/**
 * /llms.txt — a plain-text summary of the site for AI assistants and crawlers
 * (https://llmstxt.org). Generated from the same data files as the pages so it can
 * never drift from what visitors read: edit src/data/site.ts or tournament.ts, not this.
 */

/** FAQ answers are authored HTML; the file is plain text. */
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const GET: APIRoute = ({ site: base }) => {
  const abs = (path: string) => new URL(path, base).href;

  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} is a social badminton community in Singapore that runs weekly pay-per-game ` +
      `sessions for all levels, and co-organises the annual ${tournament.name} tournament. ` +
      `Website: ${site.url}`,
    '',
    '## Pages',
    '',
    `- [Home](${abs('/')}): Weekly games, venue, what is included, FAQ and how to join.`,
    `- [${tournament.name}](${abs('/tournament/')}): ${tournament.description}`,
    `- [${tournament.name} draws](${abs('/tournament/draws/')}): Round-robin groups, knockout bracket and scores, updated on match day.`,
    '',
    '## Weekly games',
    '',
    `- When: ${schedule.days}, ${schedule.time}`,
    `- Where: ${venue.name}, ${venue.building}, ${venue.address}`,
    `- Price: $10 per game, pay as you play, no membership`,
    `- Levels: All levels welcome, including beginners; games are matched by level`,
    ...features.map((f) => `- ${f.title}${f.titleSub ? ` ${f.titleSub}` : ''}: ${f.body}`),
    '',
    '## Contact',
    '',
    ...contacts.whatsapp.map((c) => `- WhatsApp ${c.label}: ${c.href}`),
    ...contacts.telegram.map((c) => `- Telegram ${c.label}: ${c.href}`),
    `- Community WhatsApp group: ${WHATSAPP_GROUP}`,
    ...socials.map((s) => `- ${s.label}: ${s.href}`),
    '',
    '## FAQ',
    '',
    ...faq.items.flatMap((item) => [`- Q: ${item.q}`, `  A: ${stripHtml(item.a)}`]),
    '',
    `## ${tournament.name}`,
    '',
    `- Date: ${tournamentHero.facts.map((f) => [f.value, f.note].filter(Boolean).join(' ')).join(', ')}`,
    `- Venue: ${tournamentHero.venue.name}, ${tournamentHero.venue.lines.join(' ')}`,
    `- ${tournament.collaboration}`,
    `- Registration: ${REGISTRATION_FORM_URL}`,
    ...details.rows.map((r) => `- ${r.label ? `${r.label} ` : ''}${r.text}`),
    '',
    '### Categories',
    '',
    ...categories.items.map(
      (c) =>
        `- ${c.title}: ` +
        c.rows
          .map((r) => [r.label, r.text].filter(Boolean).join(' '))
          .filter((s) => s && !/:$/.test(s))
          .join('; '),
    ),
    '',
    '### Prizes',
    '',
    ...prizes.items.map(
      (p) =>
        `- ${p.title}: ${p.total.label} ${p.total.value}. ${p.firstLabel} ` +
        // The adult card's single split line repeats the card label; print it once.
        p.first.map((f) => (f.label === p.firstLabel ? f.value : `${f.label} ${f.value}`)).join(', ') +
        `. ${p.second.label} ${p.second.value}`,
    ),
    '',
    '### Sponsors',
    '',
    ...sponsors.items.map((s) => `- ${s.name}${s.href ? `: ${s.href}` : ''}`),
    '',
    '## Optional',
    '',
    `- [Sitemap](${abs('/sitemap-index.xml')}): XML sitemap of all pages.`,
    `- [Event poster](${abs('/tournament/starrise-cup-poster.jpg')}): ${tournament.name} poster image.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
