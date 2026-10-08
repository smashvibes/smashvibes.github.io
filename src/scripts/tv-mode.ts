/**
 * TV mode and tab memory for the draws and live pages.
 *
 * On the day the draws page sits on a hall TV. TV mode hides the site chrome and scales
 * the boards up (the CSS lives under `html[data-tv]` in tournament.css); it is entered
 * from the button, or by opening the page with `?tv` so a bookmark lands straight in it,
 * and left with the button or Esc. The choice is remembered per browser.
 *
 * The draw and stage tabs are CSS radios, so a reload would drop back to the first
 * draw — annoying on a TV that someone set to Open Doubles. Their selection is stored
 * and restored too.
 */
const TV_KEY = 'sv-tv';
const TABS_KEY = 'sv-draw-tabs';

const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-tv-toggle]');

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the page still works, it just forgets */
  }
}

function setTv(on: boolean): void {
  root.toggleAttribute('data-tv', on);
  write(TV_KEY, on ? '1' : '0');
  for (const b of buttons) {
    b.textContent = on ? b.dataset.tvExit ?? 'Exit TV mode' : b.dataset.tvEnter ?? 'TV mode';
    b.setAttribute('aria-pressed', String(on));
  }
}

const wanted = new URLSearchParams(location.search).has('tv') || read(TV_KEY) === '1';
setTv(wanted);
for (const b of buttons) b.addEventListener('click', () => setTv(!root.hasAttribute('data-tv')));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && root.hasAttribute('data-tv')) setTv(false);
});

// --- tab memory -------------------------------------------------------------

const radios = document.querySelectorAll<HTMLInputElement>('input.sv-dr-radio, input.sv-dr-stage-radio');
if (radios.length) {
  const saved = read(TABS_KEY);
  if (saved) {
    for (const id of saved.split(',')) {
      const r = document.getElementById(id);
      if (r instanceof HTMLInputElement) r.checked = true;
    }
  }
  const remember = () =>
    write(TABS_KEY, [...radios].filter((r) => r.checked).map((r) => r.id).join(','));
  for (const r of radios) r.addEventListener('change', remember);
}
