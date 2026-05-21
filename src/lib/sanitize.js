// Strip references to third-party study sites from any user-visible string.
// Centralized so all dynamic surfaces (search APIs, AI study results, etc.)
// can apply the same scrubbing consistently. The intent is to prevent
// retrieved-corpus snippets from leaking source-site mentions to visitors.
//
// IMPORTANT: this is best-effort defense in depth. Source data has already
// been cleaned at the file level; this catches anything that slips through
// at runtime (e.g., Pinecone vectors loaded long ago with embedded URLs).

const BANNED = [
  /\bquizlet\.?(com)?\b/gi,
  /\bchegg\.?(com)?\b/gi,
  /\bcourse[\s-]?hero\.?(com)?\b/gi,
  /\bstudocu\.?(com)?\b/gi,
  /\bbrainly\.?(com)?\b/gi,
  /\bstudyhub\.?(com)?\b/gi,
  /\bstudyblue\.?(com)?\b/gi,
  /\bgauthmath\.?(com)?\b/gi,
];

const URL_PATTERNS = [
  /https?:\/\/(?:www\.)?(?:quizlet|chegg|coursehero|studocu|brainly|studyhub|studyblue|gauthmath)\.com\/?\S*/gi,
];

export function sanitizeString(s) {
  if (typeof s !== 'string' || !s) return s;
  let out = s;
  for (const re of URL_PATTERNS) out = out.replace(re, '');
  for (const re of BANNED) out = out.replace(re, '');
  // Collapse multi-spaces but preserve newlines for prose content
  out = out.replace(/[ \t]+/g, ' ').replace(/^\s+|\s+$/g, '');
  return out;
}

// Recursively sanitize string values in an arbitrary object/array.
// Returns a new object (does NOT mutate). Safe for JSON responses.
export function sanitizeDeep(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = sanitizeDeep(value[k]);
    return out;
  }
  return value;  // numbers, booleans, etc. pass through
}

// Convenience: check whether a string contains any banned term.
// Used by tests to verify the sanitization is working.
export function containsBanned(s) {
  if (typeof s !== 'string') return false;
  return BANNED.some(re => { re.lastIndex = 0; return re.test(s); });
}

// === Vendor / certification name stripping (separate from banned terms) ===
// Used for UI chip labels so we don't surface third-party vendor trademarks
// directly as branded badges. The underlying page can still mention the vendor
// (nominative fair use for course identification), but in compact chip-style
// UI we generalize to avoid the implication of affiliation.
const VENDOR_PATTERNS = [
  /\bcomptia\b/gi,
  /\bcisco\b/gi,
  /\baws\b/gi,
  /\bamazon[\s-]?web[\s-]?services\b/gi,
  /\bmicrosoft\b/gi,
  /\bazure\b/gi,
  /\bgoogle[\s-]?cloud\b/gi,
  /\bgcp\b/gi,
  /\boracle\b/gi,
  /\bred[\s-]?hat\b|\bredhat\b/gi,
  /\bec[\s-]?council\b/gi,
  /\bisaca\b/gi,
  /\bisc[²2]\b|\(isc\)[²2]?\b/gi,
  // Cert/product names that uniquely identify the vendor
  /\bcissp\b/gi,
  /\bcism\b/gi,
  /\bcisa\b/gi,
  /\bceh\b/gi,
  /\boscp\b/gi,
  /\bccna\b/gi,
  /\bccnp\b/gi,
  /\bsecurity\+/gi,
  /\bsecurity[\s-]plus\b/gi,
  /\bnetwork\+/gi,
  /\bnetwork[\s-]plus\b/gi,
  /\ba\+ /gi,
  /\bserver\+/gi,
  /\blinux\+/gi,
  /\bproject\+/gi,
  /\bpentest\+/gi,
  /\bsysadmin\+/gi,
];

const BUCKET_FALLBACK = {
  cert_it: 'IT Cert Practice',
  cbt_annual: 'DoD Annual Training',
  cbt_security: 'Security Training',
  cbt_jko: 'Joint Training',
  cbt_health: 'Health Training',
  cbt_army: 'Army Material',
  cbt_af: 'Air Force Material',
  cbt_navy: 'Navy Material',
  cbt_marine: 'Marine Material',
  cbt_prof: 'Professional Development',
  cbt_ammo: 'Ammunition Training',
};

// Returns a chip-safe label. Strips vendor/trademark names from the title;
// if the result is too short to be meaningful, falls back to a generic
// bucket-level label.
export function safeChipLabel(title, bucket) {
  if (!title) return BUCKET_FALLBACK[bucket] || 'Study Material';
  let stripped = title;
  for (const re of VENDOR_PATTERNS) stripped = stripped.replace(re, '');
  stripped = stripped
    .replace(/[\s\-_]+/g, ' ')
    .replace(/^[\s\-_,]+|[\s\-_,]+$/g, '')
    .trim();
  if (stripped.length < 4) return BUCKET_FALLBACK[bucket] || 'Study Material';
  return stripped;
}

// Returns true if any vendor trademark is still present (test helper).
export function containsVendor(s) {
  if (typeof s !== 'string') return false;
  return VENDOR_PATTERNS.some(re => { re.lastIndex = 0; return re.test(s); });
}
