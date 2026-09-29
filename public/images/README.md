# Images

| File | Used by | Status |
| --- | --- | --- |
| `hero-player.jpg` | Hero | ✅ Real — 1600×900, supplied Sept 2026 |
| `cta-racket.jpg` | Closing CTA | ✅ Real — 1600×900, supplied Sept 2026 |
| `venue-courts.jpg` | Venue panel | ⚠️ **Placeholder** — low-res crop of the mockup |
| `community-1…4.jpg` | Community grid | ⚠️ **Placeholder** — low-res crops of the mockup |

Replace the placeholders in place, keeping the filenames. Alt text lives in
`src/data/site.ts`, not here.

## Still needed

| Slot | Shoot notes | Suggested export |
| --- | --- | --- |
| `venue-courts.jpg` | Wide shot of the courts at SBH, lit, empty | 1600×1000, JPEG q82 |
| `community-1…4.jpg` | Bright, candid group photos and rallies; 4:3 crop | 1200×900 each, q82 |

Design-system rules that apply: real players on real courts, no stock-looking poses,
and no filters that shift the green of the courts.

## Notes

Both real photographs are cropped by CSS (`object-fit: cover`) rather than baked to a
fixed aspect, so a replacement at any 16:9-ish size drops straight in. The framing is
tuned via `object-position` in `src/styles/site.css` — the hero sits at `68% 35%` to
keep the racket head inside the crop, so a new photo with a differently placed subject
may want that value adjusted.
