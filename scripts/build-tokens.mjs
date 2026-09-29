/**
 * tokens.json (design-system source of truth) -> src/styles/tokens.css
 *
 * Keeping this generated rather than hand-written means the CSS custom properties
 * can never drift from the design system. Re-run via `npm run tokens`; `npm run build`
 * does it automatically.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const tokens = JSON.parse(readFileSync(new URL('src/design-system/tokens.json', root), 'utf8'));

const THEME = 'light'; // the system ships a single theme, id "light" / name "Site"

const lines = [];
const section = (title) => lines.push('', `  /* ${title} */`);

lines.push(
  '/* GENERATED FILE — do not edit.',
  ' * Source: src/design-system/tokens.json · regenerate with `npm run tokens`',
  ' */',
  ':root {'
);

section('Colour');
for (const t of tokens.color.tokens) lines.push(`  --${t.name}: ${t.value[THEME]};`);

section('Type');
for (const [name, stack] of Object.entries(tokens.type.families)) lines.push(`  --font-${name}: ${stack};`);
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    lines.push(
      `  --text-${s.name}: ${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${group.family.toLowerCase()});`
    );
    if (s.letterSpacing) lines.push(`  --tracking-${s.name}: ${s.letterSpacing};`);
  }
}

for (const [key, label] of [['spacing', 'Spacing'], ['radius', 'Radius'], ['shadow', 'Shadow'], ['layout', 'Layout']]) {
  section(label);
  for (const t of tokens[key].tokens) lines.push(`  --${t.name}: ${t.value};`);
}

lines.push('}', '');

const out = new URL('src/styles/tokens.css', root);
writeFileSync(out, lines.join('\n'));
console.log(`tokens.css written (${tokens.color.tokens.length} colours) -> ${fileURLToPath(out)}`);
