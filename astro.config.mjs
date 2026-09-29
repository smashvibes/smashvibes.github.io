// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// User/organisation Pages site: served from the domain root, so no `base` needed.
// If this ever moves to a project repo, add `base: '/<repo>'` and the asset paths
// in src/data/site.ts must switch to `import.meta.env.BASE_URL` prefixes.
//
// `site` is not optional here — the sitemap and every canonical/OG URL are built
// from it.
export default defineConfig({
  site: 'https://smashvibes.github.io',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'always' },
  image: {
    // Sharp is bundled with Astro; this just makes the intent explicit.
    responsiveStyles: true,
  },
});
