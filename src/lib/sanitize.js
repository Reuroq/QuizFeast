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
