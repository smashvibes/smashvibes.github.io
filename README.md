# smashvibes.github.io

The Smash Vibes one-pager — a static site built with [Astro](https://astro.build) and
deployed to GitHub Pages. **The build ships zero JavaScript**: every component renders
to HTML at build time, and the mobile menu is a CSS-only disclosure.

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
| `src/pages/index.astro` | Section order for the page, plus the `SportsActivityLocation` JSON-LD. |
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
2. Submit `https://smashvibes.github.io/sitemap-index.xml`.
3. Run the Rich Results test on the live URL.
4. Consider a Google Business Profile — this is a local, place-based activity, and that
   is where most of the local search value sits.

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

- [ ] Replace `WHATSAPP_GROUP` in `src/data/site.ts` with the real group invite. It
      currently falls back to a direct chat with `WHATSAPP_NUMBER`, so the "Join WhatsApp
      Group" buttons work but open a 1:1 chat rather than the group.
- [ ] Replace `venue-courts.jpg` and `community-1…4.jpg` in `public/images/` — still
      low-res crops of the mockup. The hero and CTA photographs are real.
- [ ] Replace `public/smash-vibes-logo.png` with a vector master when one exists. It is
      currently a keyed-out raster of the supplied wordmark, and `sync:ds` deliberately
      does **not** overwrite it (the design system's own copy is a lower-res crop).
- [ ] Decide on **Tournaments** — its nav link still points at the closing CTA because
      the section does not exist. (FAQ is now a real section.)
- [ ] Confirm the `SportsActivityLocation` JSON-LD in `src/pages/index.astro` is accurate.
