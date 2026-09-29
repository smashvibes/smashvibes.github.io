// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// User/organisation Pages site: served from the domain root, so no `base` needed.
// If this ever moves to a project repo, add `base: '/<repo>'` and the asset paths
// in src/data/site.ts must switch to `import.meta.env.BASE_URL` prefixes.
//
// `site` MUST be the live custom domain (public/CNAME), not the github.io address:
// every canonical link, sitemap entry, Open Graph URL and JSON-LD @id is built from it,
// and pointing it at the wrong host silently splits the site across two origins for
// search engines.
export default defineConfig({
  site: 'https://www.smashvibes.sg',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'always' },
  image: {
    // Sharp is bundled with Astro; this just makes the intent explicit.
    responsiveStyles: true,
  },
});
