#!/usr/bin/env node
/**
 * Imports the StarRise Cup photo export into the site.
 *
 *   npm run gallery:import -- "<path to the Drive export folder>"
 *
 * The export holds one sub-folder per album ("1 Tournament Highlights", …), straight from
 * the photographer at full camera size (24 MP, ~9 MB a frame). Those never go into the
 * repo: GitHub Pages caps a site at 1 GB and the export alone is 1.4 GB. Each frame
 * becomes two files under public/tournament/gallery/<album>/:
 *
 *   <id>-thumb.webp  640 px wide, for the grid
 *   <id>.jpg         2048 px on the long edge, for the viewer and the download button.
 *                    JPEG rather than WebP because people save these to their phones and
 *                    forward them, and every app on earth takes a JPEG.
 *
 * plus og.jpg, a 1200×630 crop of the album cover for link previews. The photo list,
 * with pixel sizes so the grid can reserve space before anything loads, is written to
 * src/data/gallery.json. Which folder is which album lives in FOLDERS below; titles and
 * copy are in src/data/tournament.ts.
 *
 * Photos are ordered by capture time. The camera's file counter wrapped during the day
 * (IMG_9999 → IMG_0001), so file names do not sort chronologically.
 *
 * Re-running is safe: frames already converted are skipped, and files whose source has
 * gone from the folder, or is listed in SKIP, are removed.
 */
import { readdir, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/** Source folder name → album slug. The slug is the URL and must match tournament.ts. */
const FOLDERS = {
  '1 Tournament Highlights': 'highlights',
  '2 Winners & Runner-Ups': 'winners',
  '3 Guests': 'guests',
  '4 Behind The Scenes': 'behind-the-scenes',
};

/**
 * Burst frames left out of the site. The photographer delivered 2–6 near-identical shots
 * of most posed photos; one per burst is kept (picked 27 Nov 2026 for smiles and eyes
 * open, then sharpness) and the rest are listed here so a re-import does not bring them
 * back. File names as in the export, without extension.
 */
const SKIP = {
  highlights: [
    'IMG_9742', 'IMG_9743', 'IMG_9745', 'IMG_9746', // kept 9744
    'IMG_9817', 'IMG_9818', 'IMG_9819', // kept 9820
    'IMG_9821', 'IMG_9822', 'IMG_9824', 'IMG_9825', // kept 9823
    'IMG_9889', 'IMG_9890', 'IMG_9891', // kept 9892
  ],
  winners: [
    'IMG_0076', 'IMG_0077', // kept 0078
    'IMG_0080', 'IMG_0081', 'IMG_0082', // kept 0079
    'IMG_0083', 'IMG_0084', 'IMG_0086', // kept 0085
    'IMG_0087', 'IMG_0089', 'IMG_0090', 'IMG_0091', // kept 0088
    'IMG_0092', 'IMG_0093', 'IMG_0095', 'IMG_0096', // kept 0094
    'IMG_0098', 'IMG_0099', 'IMG_0100', 'IMG_0101', // kept 0097
    'IMG_0103', // kept 0102
    'IMG_0104', // kept 0105
  ],
  guests: [
    'IMG_0071', // kept 0072
    'IMG_0073', // kept 0074
    'IMG_0112', 'IMG_0113', 'IMG_0114', 'IMG_0115', 'IMG_0117', // kept 0116
    'IMG_0118', // kept 0119
    'IMG_0120', // kept 0121
  ],
  'behind-the-scenes': [
    'IMG_9811', // kept 9810
    'IMG_9812', // kept 9813
  ],
};

const THUMB_WIDTH = 640;
const LARGE_EDGE = 2048;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = path.join(root, 'public/tournament/gallery');
const manifestPath = path.join(root, 'src/data/gallery.json');

const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error('Usage: npm run gallery:import -- "<path to the photo export folder>"');
  process.exit(1);
}

/**
 * DateTimeOriginal (0x9003) from a raw EXIF block, as "YYYY:MM:DD HH:MM:SS" — which
 * sorts correctly as a plain string. Just enough TIFF walking to reach the Exif IFD;
 * not worth a dependency for one tag.
 */
function captureTime(exif) {
  if (!exif) return '';
  // sharp hands back the APP1 payload, which leads with "Exif\0\0" before the TIFF header.
  const tiff = exif.toString('latin1', 0, 4) === 'Exif' ? 6 : 0;
  const le = exif[tiff] === 0x49;
  const u16 = (o) => (le ? exif.readUInt16LE(tiff + o) : exif.readUInt16BE(tiff + o));
  const u32 = (o) => (le ? exif.readUInt32LE(tiff + o) : exif.readUInt32BE(tiff + o));
  const find = (ifd, tag) => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      if (u16(e) === tag) return e;
    }
    return -1;
  };
  try {
    const ifd0 = u32(4);
    const exifPtr = find(ifd0, 0x8769);
    if (exifPtr < 0) return '';
    const entry = find(u32(exifPtr + 8), 0x9003);
    if (entry < 0) return '';
    const at = tiff + u32(entry + 8);
    return exif.toString('latin1', at, at + 19);
  } catch {
    return '';
  }
}

const isNewer = async (out, srcFile) =>
  existsSync(out) && (await stat(out)).mtimeMs >= (await stat(srcFile)).mtimeMs;

const albums = [];

for (const [folder, slug] of Object.entries(FOLDERS)) {
  const dir = path.join(src, folder);
  if (!existsSync(dir)) {
    console.warn(`skip: no folder "${folder}"`);
    continue;
  }
  const outDir = path.join(outRoot, slug);
  await mkdir(outDir, { recursive: true });

  const skip = new Set(SKIP[slug] ?? []);
  const files = (await readdir(dir)).filter((f) => /\.je?pg$/i.test(f) && !skip.has(path.parse(f).name));
  const photos = [];

  for (const file of files) {
    const input = path.join(dir, file);
    const id = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const large = path.join(outDir, `${id}.jpg`);
    const thumb = path.join(outDir, `${id}-thumb.webp`);

    const meta = await sharp(input).metadata();
    // Orientations 5–8 are rotated a quarter turn, so the stored width is the height.
    const turned = (meta.orientation ?? 1) >= 5;
    const w0 = turned ? meta.height : meta.width;
    const h0 = turned ? meta.width : meta.height;
    const scale = Math.min(1, LARGE_EDGE / Math.max(w0, h0));
    const width = Math.round(w0 * scale);
    const height = Math.round(h0 * scale);

    if (!(await isNewer(large, input))) {
      await sharp(input)
        .rotate()
        .resize({ width, height })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(large);
    }
    if (!(await isNewer(thumb, input))) {
      await sharp(input).rotate().resize({ width: THUMB_WIDTH }).webp({ quality: 72 }).toFile(thumb);
    }

    photos.push({ id, width, height, taken: captureTime(meta.exif) || file });
    process.stdout.write('.');
  }

  photos.sort((a, b) => a.taken.localeCompare(b.taken) || a.id.localeCompare(b.id));

  // Drop outputs whose source frame was removed from the export.
  const keep = new Set(photos.flatMap((p) => [`${p.id}.jpg`, `${p.id}-thumb.webp`]).concat('og.jpg'));
  for (const f of await readdir(outDir)) if (!keep.has(f)) await rm(path.join(outDir, f));

  if (photos.length) {
    await sharp(path.join(outDir, `${photos[0].id}.jpg`))
      .resize({ width: 1200, height: 630, fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(outDir, 'og.jpg'));
  }

  albums.push({ slug, photos: photos.map(({ taken, ...p }) => p) });
  console.log(` ${slug}: ${photos.length}`);
}

await writeFile(manifestPath, JSON.stringify({ albums }, null, 2) + '\n');
console.log(`wrote ${path.relative(root, manifestPath)}`);
