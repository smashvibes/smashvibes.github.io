/**
 * Refresh the vendored design-system files from the sibling authoring repo.
 *
 * The site vendors (and commits) tokens.json, the component CSS and the assets so CI
 * builds never reach outside this repo. Run this after the design system changes:
 *   npm run sync:ds && npm run tokens
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const DS = process.env.DS_PATH ?? fileURLToPath(new URL('../smash-vibes-design-system/', root));

if (!existsSync(DS)) {
  console.error(`Design system not found at ${DS}\nSet DS_PATH to override.`);
  process.exit(1);
}

mkdirSync(fileURLToPath(new URL('src/design-system/', root)), { recursive: true });
copyFileSync(`${DS}/tokens.json`, fileURLToPath(new URL('src/design-system/tokens.json', root)));

// bundle.css @imports the Google Fonts stylesheet. We strip it: @import inside CSS is a
// render-blocking sequential fetch, whereas the <link rel="preconnect"> + <link> pair in
// Base.astro lets the browser open the connection and fetch the CSS in parallel.
const css = readFileSync(`${DS}/components/bundle.css`, 'utf8')
  .replace(/^@import url\("https:\/\/fonts\.googleapis\.com[^\n]*\n/m, '')
  .trimStart();
writeFileSync(
  fileURLToPath(new URL('src/styles/ds.css', root)),
  `/* Vendored from smash-vibes-design-system/components/bundle.css — do not edit.\n * Refresh with \`npm run sync:ds\`. Font @import stripped; fonts are linked in Base.astro.\n */\n${css}`
);

// Icons: the SVG files are the drawn source. We keep only their inner markup so the
// Icon component can own size/stroke/colour and inherit currentColor.
const iconDir = `${DS}/assets/Icons`;
const paths = Object.fromEntries(
  readdirSync(iconDir)
    .filter((f) => f.endsWith('.svg'))
    .sort()
    .map((f) => [
      f.replace(/\.svg$/, ''),
      readFileSync(`${iconDir}/${f}`, 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim(),
    ])
);
writeFileSync(
  fileURLToPath(new URL('src/design-system/icon-paths.json', root)),
  JSON.stringify(paths, null, 2) + '\n'
);

// The logo is deliberately NOT synced. The design system ships a low-resolution crop
// taken from the mockup and its own README asks for that to be replaced; the site's
// public/smash-vibes-logo.png is a cleaner keyed-out wordmark. Re-enable this copy once
// the design system ships the vector master.
// cpSync(`${DS}/assets/Logos/smash-vibes-logo.png`, fileURLToPath(new URL('public/smash-vibes-logo.png', root)));

console.log('Design system synced. Run `npm run tokens` to regenerate tokens.css.');
