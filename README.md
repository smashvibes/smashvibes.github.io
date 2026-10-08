# smashvibes.github.io

Published at **https://www.smashvibes.sg** (custom domain, see `public/CNAME`).

The Smash Vibes one-pager — a static site built with [Astro](https://astro.build) and
deployed to GitHub Pages. **The build ships zero JavaScript** on every page except the
two tournament scoreboards: every component renders to HTML at build time, and the
mobile menu is a CSS-only disclosure. The draws and live pages carry one small script
that re-fetches the organiser's sheet on match day (see [Draws](#draws)).

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/ locally
```

## How it fits together

| Path | What it is |
| --- | --- |
| `src/data/site.ts` | **All copy and links.** Edit here for content changes — no markup involved. |
| `src/pages/index.astro` | Section order for the homepage, plus its JSON-LD. |
| `src/pages/tournament.astro` | The StarRise Cup event page (`/tournament/`), plus `SportsEvent` JSON-LD. |
| `src/data/tournament.ts` | **All StarRise Cup copy, links and imagery.** |
| `src/data/draws.json` | **Snapshot of the draws sheet** — names, courts, times, scores. Written by `npm run draws:pull`; do not hand-edit. |
| `src/data/draws-engine.ts` | Reshapes the snapshot for rendering. Computes nothing: the desk types scores, statuses and the knockout line-up. Runs at build and in the browser. |
| `src/data/draws-render.ts` | HTML for the groups, bracket and live board, from the engine's view. |
| `scripts/draws-sheet.gs` | Apps Script that builds the organiser's Google Sheet and serves it as JSON. |
| `src/styles/tournament.css` | Tournament layout. `sv-tr-` prefixed so it cannot collide with the homepage. |
| `src/components/` | Design-system components ported to `.astro`, plus page-specific compositions. |
| `src/design-system/site-icons.json` | Marks the design system does not ship — currently the WhatsApp logo. |
| `src/design-system/` | Vendored from the design system: `tokens.json`, `icon-paths.json`. Do not hand-edit. |
| `src/styles/tokens.css` | **Generated** from `tokens.json`. Do not hand-edit. |
| `src/styles/ds.css` | **Vendored** design-system component CSS. Do not hand-edit. |
| `src/styles/site.css` | Page layout. Composes the system; never redefines a token. |
| `src/assets/images/` | Photography. Processed at build time — see `public/images/README.md`. |
| `public/` | Files needing stable URLs: favicons, manifest, robots.txt, OG image. |

## Relationship to the design system

The site vendors and commits its design-system inputs so CI never reaches outside the
repo. When `smash-vibes-design-system` changes:

```bash
npm run sync:ds   # re-copies tokens.json, ds.css, icon paths and the logo
npm run tokens    # regenerates src/styles/tokens.css
```

`sync:ds` looks for the design system as a sibling directory; override with
`DS_PATH=/path/to/smash-vibes-design-system npm run sync:ds`.

The nine system components were ported to `.astro` rather than consumed from
`components/bundle.js`, which is a browser-global UMD file that reads `window.React`.
Importing it would mean shipping React to render a page with no interactivity. The ports
keep the system's exact markup and `sv-*` class names, so `ds.css` still drives every
visual decision — only the rendering layer changed.

Two components carry additive extensions, both to match the mockup and both optional:

- `Feature` takes `titleSub` (the "$10 / per game" card).
- `HighlightStrip` items take `sub` (the same treatment in the hero row).

## SEO

Everything is driven from `src/data/site.ts`, so there is one place to edit.

| Item | Where | Notes |
| --- | --- | --- |
| Title tag | `site.title` | 49 chars. Primary keyword first, brand last. Keep under 60. |
| Meta description | `site.description` | 158 chars. Keep under 160 or it truncates. |
| Canonical | `Base.astro` | Built from `site` in `astro.config.mjs`. |
| Robots meta | `Base.astro` | `index, follow, max-image-preview:large` — opts the photography into full-size previews. |
| `robots.txt` | `public/robots.txt` | Allows everything, points at the sitemap. |
| XML sitemap | `@astrojs/sitemap` | Generates `/sitemap-index.xml` at build. **Submit that URL in Search Console.** |
| Open Graph / Twitter | `Base.astro` | Full card set incl. `og:image:width/height` and image alt. |
| Structured data | `src/pages/index.astro` | One `@graph`: `WebSite`, `SportsActivityLocation`, `FAQPage`. |
| Favicons | `public/` | `.ico` (16/32/48), 16/32 PNG, 180 apple-touch, 192/512 + manifest. |

### Keywords

Targeted, in priority order. Chosen from how Singapore players describe the thing, **not
from volume data** — validate in Search Console once there is traffic and adjust the
copy. Do not add a `keywords` meta tag; search engines ignore it.

`badminton Singapore` · `badminton games Singapore` · `social badminton Singapore` ·
`casual badminton Singapore` · `badminton community Singapore` · `badminton kaki` ·
`badminton for beginners Singapore` · `badminton session Geylang` ·
`Singapore Badminton Hall` · `$10 badminton Singapore` · `weekly badminton Singapore`

These appear naturally in the title, description, H1/H2s, the features intro and the FAQ
answers. Nothing is stuffed — if you add copy, keep it readable first.

### Headings

One `<h1>` (the hero), then `<h2>` per section and `<h3>` for feature titles and FAQ
questions. The FAQ questions are real `<h3>`s inside `<summary>`, which is valid and puts
them in the document outline.

### Structured data

`FAQPage` is generated from the same array the page renders, so the markup and the
visible text cannot disagree — Google requires that for the markup to be eligible.
Validate changes at <https://search.google.com/test/rich-results>.

### Page speed

Photographs are imported through `astro:assets`, which emits WebP with a responsive
`srcset`. A 1440px desktop load pulls roughly **136KB of imagery, down from ~440KB** of
raw JPEG; a phone pulls about 97KB. The hero is `loading="eager"` + `fetchpriority="high"`
as the LCP element; everything below the fold is lazy. CSS is inlined, and the page ships
no JavaScript at all.

### After the first deploy

1. Verify the property in Google Search Console.
2. Submit `https://www.smashvibes.sg/sitemap-index.xml`.
3. Run the Rich Results test on the live URL.
4. Consider a Google Business Profile — this is a local, place-based activity, and that
   is where most of the local search value sits.

## Pages

| Route | What it is |
| --- | --- |
| `/` | The Smash Vibes homepage. |
| `/tournament/` | StarRise Cup — the event page, linked from the main nav as "Tournaments". |
| `/tournament/draws/` | Draws: one tab per category, each with a round-robin fixture list and a knockout bracket. |
| `/tournament/live/` | **Hidden for now.** Live scoreboard: per category, matches in progress, up next and latest results. The page is `src/pages/tournament/_live.astro`; rename it to `live.astro` and restore the "Live" links in `src/data/tournament.ts` to publish it. |

The tournament page is a separate event brand run in collaboration with Smash Vibes, so
it keeps its own wordmark and navigation but is built entirely from the Smash Vibes
design system: the same `Button`, `NavBar`, `SectionHeading` and `Icon` components, the
same tokens, and the same dark/light ground alternation. Its own classes are `sv-tr-`
prefixed.

### Theming

The tournament pages are light-and-gold where Smash Vibes is dark-and-gold. Rather than
fork the design system, `tournament.css` redefines a handful of tokens (`--ink` to deep
navy, `--line` to a gold hairline, warmer grounds) on the `.sv-tr-page` wrapper.

Two things about that file are load-bearing. Astro emits it **before** `tokens.css` and
`site.css`, so:

1. The overrides hang off `.sv-tr-page`, not `:root`. A custom property redefined on a
   descendant wins for that subtree whatever the source order; a second `:root` block
   would simply lose to the later one.
2. Anything overriding a design-system rule carries a `.sv-tr-page` prefix for the extra
   specificity. Without it `site.css` wins on source order and the override silently
   does nothing — which is exactly how the hero first rendered on a black ground.

### Draws

`/tournament/draws/` uses CSS-only radio tabs: one tab per draw, and inside each draw a
second pair of tabs for its two stages, **Round Robin** and **Knockout Draw**. Every
category runs the same shape — four groups of four, top two through to the quarter
finals. Which draws exist is declared in `draws` in `src/data/tournament.ts`; what is in
them comes from the organiser's Google Sheet.

#### The sheet is the admin panel

There is no login to build. The match desk types names, courts, times, scores and the
knockout line-up into a Google Sheet; whoever can edit the
sheet is the admin, and nobody else can change anything. `scripts/draws-sheet.gs` creates that sheet and, deployed as a web app, serves
it as JSON. The site reads it in two ways:

1. **At build time**, from `src/data/draws.json`. `npm run draws:pull` fetches the feed
   and overwrites the snapshot; commit it and the deploy carries the latest names and
   times as static HTML. `npm run draws:template` writes the empty structure instead.
2. **In the browser**, on match day. `src/scripts/draws-live.ts` re-fetches the feed
   every 45 seconds while the tab is visible and re-renders the groups, bracket and live
   board in place. It only runs when `src/data/draws-feed.json` has a URL, and a failed
   fetch leaves the last good render up.

Both paths go through the same engine and renderer (`draws-engine.ts`,
`draws-render.ts`), so a live refresh cannot disagree with the page as built.

#### On the hall TV

The draws page is shown on a TV on the day, so match state has to read from across a
hall: a live match is a warm row with a gold edge and a pulsing **LIVE** pill, a
finished one a green **DONE** tick with its score set white on navy, an upcoming one
plain. The legend sits in the toolbar under the title.

**TV mode** (the toolbar button, or open the page with `?tv`) hides the site chrome,
folds the title, draw tabs and toolbar into one header row, and scales the board up
with `zoom: 1.3`, so a 1920×1080 screen lays out as 1477×831 and all four groups of a
draw fit without scrolling. Fixture rows there keep names on one line, sharing the
space by length. Esc leaves it. The
mode and the selected draw and stage tabs are remembered per browser
(`src/scripts/tv-mode.ts`), so a reload on the TV lands back where it was.

**The site computes nothing.** What the desk keys in is what the page shows: the
referees decide results and who goes through. There is no standings table, by choice:
the fixture list with scores says what happened, and the knockout rows say who went
through. The sheet has a Read Me, an Entries tab and one tab per event:

- *Entries*: one row per player or pair — event, group, seat, name.
- *U17 Singles*, *U17 Doubles*, *Open Doubles*: one row per match in playing order, the
  24 group matches then QF 1–4, SF 1–2 and the Final. Columns are Stage, Match, Court,
  Time, Player A, Player B, Score and Status. Group rows look their players up on
  Entries; knockout rows say "1st Group A" or "Winner QF 1" until the desk types the
  name over it. Score is free text — `21-15`, or `21-15, 18-21, 21-19` for best of
  three — which the site splits into the per-side boxes; anything else, such as `W/O`,
  is shown as written. Status is Live or Done, and the Live page's three columns come
  straight from it.

Setting it up, once:

| Step | Where |
| --- | --- |
| Paste `scripts/draws-sheet.gs` into a new Apps Script project and run `createDrawsSheet()` | script.google.com |
| Copy the logged ID into `SHEET_ID`, then Deploy → Web app, execute as Me, access Anyone | same project |
| Paste the `/exec` URL into `src/data/draws-feed.json`, run `npm run draws:pull`, commit | this repo |
| Share the sheet with the match desk as Editor | Google Sheets |

After editing `draws-sheet.gs`, paste it over the project again and publish a new
version of the deployment (the URL stays). If the columns changed, run
`upgradeDrawsSheet()` too: it adds what is missing to the existing sheet in place.

The structure (events, fixture order, knockout references, draft timetable) lives in
both `draws-sheet.gs` and `scripts/pull-draws.mjs`, because Apps Script cannot import
from the repo. Change them together. **The timetable after the U17 Singles groups is a
draft** on four courts with 15-minute group slots; the organiser adjusts it in the sheet.

#### Layout

The round-robin stage is a fixture list per group, M1 onwards (1v2, 3v4, 1v3, 2v4, 1v4,
2v3, so nobody plays twice in a row and the last round decides).

The bracket is one CSS grid shared by every round — `entries / 2` match rows plus a
header row. A round-N match spans `2^(N-1)` rows and centres in them, which lands it
exactly level with the midpoint of the two matches feeding it, with no measuring and no
script. Connectors are drawn with two pseudo-elements per match. Each round is
`display: contents` so its children join the shared grid while the markup stays grouped
by round — which is what lets the mobile layout stack rounds by flipping one property.

Below 1000px the columns stop being readable, so rounds stack vertically under their
headers and the connectors are dropped. That beats panning a 1200px-wide bracket on a
phone.

Six outline icons the system does not ship (`clock`, `bracket`, `chart`, `rules`, `user`,
`users-plus`) and four social marks were added to `src/design-system/site-icons.json`, drawn to the
system's rules: 24px grid, 1.75 stroke, round caps, `currentColor`.

## Tournament registration

`scripts/create-registration-form.gs` holds the whole form definition and has two entry
points. Paste the file into the Apps Script project, then run one of:

| Function | What it does |
| --- | --- |
| `updateExistingForm()` | Applies the file to the form already live at `FORM_ID`, **keeping its URL**. Use this for every change. Safe to re-run. |
| `verifyForm()` | Prints the live form's branching and flags any path that can finish without the waiver. Run it after any change. |
| `listRegistrationForms()` | Lists every StarRise form on the account and marks which one `FORM_ID` — and therefore the website — points at. Use it when a test seems to contradict the live form. |
| `createRegistrationForm()` | Builds a brand new form. Only for starting over — it produces a different URL the site is not pointing at. |

Google Forms caches an open tab, so a tab that was up before an update keeps showing the
old flow until it is reloaded. Always retest in a private window.

Forms puts **Submit** on whichever section is physically last, whatever the branch
navigation says — so the waiver has to *be* last, not merely be the branch target.
`updateExistingForm` moves it there, and `verifyForm` reports it if it drifts.

`updateExistingForm` finds pages by title and only adds the waiver page if it is missing,
so re-running it does not duplicate anything. It deliberately does not rewrite the
per-player questions — editing those in place would orphan existing responses.

The form is **live** and wired in. Every "Register Now" button — nav, hero and closing
band, on both tournament routes — reads `REGISTRATION_FORM_URL` in
`src/data/tournament.ts`. Emptying it falls back to the WhatsApp chat rather than going
dead.

| | |
| --- | --- |
| Form (share this) | <https://docs.google.com/forms/d/e/1FAIpQLSd1RCb3B_Uh3udfJ4rNhDTvblKMZ4sRynsKPizbVibVU-OHwA/viewform> |
| Form (edit) | <https://docs.google.com/forms/d/1YNtTzgFumfKaYvcaKYQaUV1p-gbDuT8Q6vwOgKCwBS4/edit> |
| Responses | <https://docs.google.com/spreadsheets/d/1RGpG_7xmVjjLCT11hziGWlupfc2OSGPb7lOhJcAe6tg/edit> |

The script also carries `updateCategoryAvailability()`: Google Forms cannot cap
responses, so this removes a category from the list once it hits its entry limit
(16 / 16 / 5 / 5). Install it with `installCapTrigger()` if you want that automatic.

**Confirm before running:** the under-17 cut-off is set to "under 17 on the event date"
(born on or after 15 November 2009). Age-as-at-event-date versus age-as-at-1-January is
the most common eligibility dispute in junior draws — pick one and state it.

## Responsive layout

Breakpoints, widest first — all in `src/styles/site.css`:

| Width | What changes |
| --- | --- |
| 1080 | Venue split stacks; footer goes to two columns |
| 920 | Nav collapses to the burger — six links plus the logo and CTA stop fitting well before the design system's own 720px nav breakpoint |
| 860 | Hero and closing CTA switch from photo-behind-text to photo-as-band; stats become 2×2; photo grid to two columns |
| 720 | Phone gutters (16px) and reduced section padding |
| 480 | Actions go full width |
| 380 | The duplicate nav CTA is dropped — the hero's is a thumb-length below |

On phones the hero photograph is a full-bleed band under the copy rather than a
backdrop: behind text at low opacity it read as grey mud. It sits at full strength with
`mask-image` fading its top edge into `night-900`, which keeps the action shot the
design is built around.

### Testing narrow viewports

**Headless Chrome silently clamps its window to a 500px minimum**, so
`--window-size=390,…` renders at 500px and crops the screenshot to 390 — which looks
exactly like horizontal overflow but is not. To get a true phone viewport, nest the page
in a fixed-width iframe (each iframe establishes its own viewport, and the media queries
inside respond to the iframe width):

```html
<iframe src="/" style="width:390px;height:3000px;border:0"></iframe>
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to
GitHub Pages via OIDC. **One-time setup:** repository *Settings → Pages → Build and
deployment → Source* must be set to **GitHub Actions**.

## Before launch

- [ ] Replace `community-1…4.jpg` in `src/assets/images/` — still low-res crops of the
      mockup. The hero, CTA and venue photographs are real.
- [ ] Replace `public/smash-vibes-logo.png` with a vector master when one exists. It is
      currently a keyed-out raster of the supplied wordmark, and `sync:ds` deliberately
      does **not** overwrite it (the design system's own copy is a lower-res crop).
- [ ] **StarRise Cup**: supply the StarRise wordmark as a vector, the websites of 3W
      Logistics and Athens (their cards do not link and their logos are crops of the
      mockup; the other five are the sponsors' own files and link out), social handles (`socials` in `src/data/tournament.ts` — the icons render as muted
      marks until each gets an `href`), and tournament-specific FAQ copy (that nav item
      currently points at the Smash Vibes FAQ).
- [ ] Replace the StarRise Cup guest portrait — still a crop of the tournament mockup.
      The hero and venue photographs are real.
- [ ] Confirm the `SportsActivityLocation` JSON-LD in `src/pages/index.astro` is accurate.
