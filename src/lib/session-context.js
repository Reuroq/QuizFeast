// Tab-session memory of which CBTs + sections the visitor has engaged with.
// Used to bias /api/answers/global-search results toward what they're studying.
// sessionStorage = forgets when tab closes. No persistence, no cookies.

const SLUG_KEY = 'qf_recent_slugs';
const SECTION_KEY = 'qf_recent_sections';
const MAX = 10;

function safeGet(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function safeSet(key, arr) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(arr.slice(0, MAX)));
  } catch {}
}

// Push a slug to the recent list. Dedupes (existing entry moves to front).
export function pushRecentSlug(slug) {
  if (!slug) return;
  const cur = safeGet(SLUG_KEY).filter(s => s !== slug);
  cur.unshift(slug);
  safeSet(SLUG_KEY, cur);
}

export function pushRecentSection(section) {
  if (!section) return;
  const cur = safeGet(SECTION_KEY).filter(s => s.toLowerCase() !== section.toLowerCase());
  cur.unshift(section);
  safeSet(SECTION_KEY, cur);
}

export function getRecentSlugs() {
  return safeGet(SLUG_KEY);
}

export function getRecentSections() {
  return safeGet(SECTION_KEY);
}
