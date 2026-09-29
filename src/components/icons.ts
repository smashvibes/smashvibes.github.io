/**
 * Icon registry. `icon-paths.json` is generated from the design system's SVG assets
 * (`npm run sync:ds`); `site-icons.json` holds marks the system doesn't ship.
 */
import dsPaths from '../design-system/icon-paths.json';
import sitePaths from '../design-system/site-icons.json';

export const ICON_PATHS: Record<string, string> = { ...dsPaths, ...sitePaths };

export type DesignSystemIconName = keyof typeof dsPaths;
export type IconName = DesignSystemIconName | keyof typeof sitePaths;

/**
 * Solid glyphs opt out of the 1.75 outline stroke the rest of the set uses.
 *
 * The WhatsApp mark ("whatsapp [#128]", supplied Sept 2026) is the solid form: one path
 * whose bubble and handset subpaths overlap, knocked out by `fill-rule: evenodd` so the
 * button colour shows through the handset. Splitting it into two <path> elements does
 * NOT work — the fill rule applies per path, so the handset would fill solid and vanish.
 *
 * Its source art is a 20-unit box carrying two nested transforms; the stored markup wraps
 * it in a single `translate(-242,-7437)` that bakes those out and centres it on our 24
 * grid. Keep the wrapper if you ever re-export it.
 */
export const SOLID_ICONS = new Set<string>(['whatsapp']);

/**
 * Icons supplied as raster artwork rather than a path. They render as a CSS mask filled
 * with `currentColor`, so a PNG still obeys the system's colour rules — gold-400 on dark,
 * gold-600 on light — instead of being locked to the colour it was exported in.
 *
 * The file must have a real alpha channel; the mask uses its transparency, not its pixels.
 */
export const MASK_ICONS: Record<string, string> = {
  shuttlecock: '/birdie.png',
};
