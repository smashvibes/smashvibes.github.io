// @ts-check
import { defineConfig } from 'astro/config';

// User/organisation Pages site: served from the domain root, so no `base` needed.
// If this ever moves to a project repo, add `base: '/<repo>'` and the asset paths
// in src/data/site.ts must switch to `import.meta.env.BASE_URL` prefixes.
export default defineConfig({
  site: 'https://smashvibes.github.io',
  build: { inlineStylesheets: 'always' },
});
