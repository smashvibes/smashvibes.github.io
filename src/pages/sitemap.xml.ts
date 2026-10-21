import type { APIRoute } from 'astro';

// Convenience alias for the conventional /sitemap.xml path.
//
// @astrojs/sitemap always emits `sitemap-index.xml` + `sitemap-0.xml` and offers no
// way to write a plain `sitemap.xml`. robots.txt and Search Console point at the real
// index, so this exists only so that crawlers and people who guess /sitemap.xml do
// not get a 404. It mirrors the generated index: one entry, the first chunk.
export const GET: APIRoute = ({ site }) => {
  const chunk = new URL('/sitemap-0.xml', site).href;
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    `<sitemap><loc>${chunk}</loc></sitemap>` +
    `</sitemapindex>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
