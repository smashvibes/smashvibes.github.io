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
| `public/images/` | Placeholder photography — see `public/images/README.md`. |

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
