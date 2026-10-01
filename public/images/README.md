# Images

Photographs live in **`src/assets/images/`**, not here — Astro's asset pipeline hashes
them, converts to WebP and generates a responsive `srcset` at build time. This directory
holds only files that need a stable, un-hashed URL.

| File | Used by | Status |
| --- | --- | --- |
| `og-cover.jpg` (here) | Open Graph / Twitter card | ✅ Generated 1200×630 |
| `src/assets/images/hero-player.jpg` | Hero | ✅ Real — 1600×900 |
| `src/assets/images/cta-racket.jpg` | Closing CTA | ✅ Real — 1600×900 |
| `src/assets/images/venue-courts.jpg` | Venue card | ✅ Real — SBH Premier Courts |
| `src/assets/images/community-1…4.jpg` | Community grid | ⚠️ **Placeholder** — mockup crops |

## Replacing a photo

Drop the new file into `src/assets/images/` keeping its filename. Nothing else changes —
the import in `src/data/site.ts` picks it up and the build regenerates every size. Alt
text lives in `src/data/site.ts`, not here.

## Still needed

| Slot | Shoot notes | Suggested export |
| --- | --- | --- |
| `community-1…4.jpg` | Bright, candid group photos and rallies; 4:3 crop | 1200×900 each |

Export generously sized JPEGs — the build downscales and converts, so there is no reason
to pre-optimise. Design-system rules apply: real players on real courts, no stock-looking
poses, no filters that shift the green of the courts.

## Regenerating the OG image

`og-cover.jpg` was composed as an HTML page and screenshotted at 1200×630 so it could use
the real brand fonts. Rebuild it the same way if the hero photo or tagline changes — it
is the image that appears when the link is shared on WhatsApp, and a stale one is worse
than none.
