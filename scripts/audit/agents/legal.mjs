// LegalAgent — content safety + brand consistency checks.
// Catches: banned-term leaks, surfacing of vendor trademarks in places
// where they shouldn't appear, broken legal-page contracts.

const BANNED_TERMS = [
  /\bquizlet\b/i, /\bchegg\b/i, /\bcourse[\s-]?hero\b/i,
  /\bstudocu\b/i, /\bbrainly\b/i,
];

// Vendor trademarks that shouldn't surface in chip/badge UI (full pages
// can use them under nominative fair use)
const VENDOR_CHIP_PATTERNS = [
  // <button|span class="...chip..."> ... COMPTIA SECURITY+...
  /class="[^"]*(?:chip|badge|pill|rounded-full)[^"]*"[^>]*>\s*[^<]*\b(comptia|cissp|cism|ccna|security\+|network\+|aws|azure|cisco|microsoft|isaca|ec-council)\b/i,
];

// Legal page contracts — required phrases per URL pattern
const LEGAL_REQUIRED = {
  '/terms': [
    /Nightshift Labs LLC/i,
    /arbitration/i,
    /Nevada/i,
    /class[\s-]action waiver/i,
  ],
  '/dmca': [
    /Designated/i,
    /takedown/i,
    /Section 512/i,
    /dwaynemorise007@gmail\.com/,
  ],
  '/privacy': [
    /sessionStorage/i,
    /Pinecone/i,
    /Render/i,
  ],
  '/disclaimer': [
    /not affiliated/i,
    /may be wrong/i,
    /nominative fair use/i,
  ],
};

export async function runLegalAgent({ url, category, store }) {
  let html;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    html = await res.text();
  } catch { return; }

  // 1. Banned-term scrub regression check
  for (const re of BANNED_TERMS) {
    const m = html.match(re);
    if (m) {
      store.report({
        agent: 'legal', category: 'banned-term-leak', severity: 'high', url,
        sub_key: m[0].toLowerCase(),
        message: `Banned term "${m[0]}" appeared in rendered HTML`,
        evidence: { kind: 'text', value: html.slice(Math.max(0, m.index - 60), m.index + 100) },
        suggested_fix: 'Strip term via sanitizeDeep on the relevant API/page',
        auto_fixable: true,
      });
    }
  }

  // 2. Vendor trademarks in chip UI elements
  for (const re of VENDOR_CHIP_PATTERNS) {
    const m = html.match(re);
    if (m) {
      store.report({
        agent: 'legal', category: 'vendor-chip-leak', severity: 'medium', url,
        sub_key: m[0].slice(0, 40),
        message: `Vendor trademark surfaced in chip/badge UI`,
        evidence: { kind: 'text', value: m[0].slice(0, 200) },
        suggested_fix: 'Apply safeChipLabel() before rendering',
        auto_fixable: false,
      });
    }
  }

  // 3. Required phrases on legal pages
  const pathname = new URL(url).pathname;
  const required = LEGAL_REQUIRED[pathname];
  if (required) {
    for (const re of required) {
      if (!re.test(html)) {
        store.report({
          agent: 'legal', category: 'legal-missing-phrase', severity: 'high', url,
          sub_key: re.toString(),
          message: `${pathname} missing required legal phrase ${re.toString()}`,
          suggested_fix: 'Restore the legal language',
          auto_fixable: false,
        });
      }
    }
  }

  // 4. Threshold leak on /answers — make sure correction modal copy was
  // scrubbed correctly
  if (category === 'answers-slug') {
    if (/After \d+ people submit/i.test(html)) {
      store.report({
        agent: 'legal', category: 'threshold-leak', severity: 'high', url,
        message: `Correction modal exposes vote threshold to visitors`,
        suggested_fix: 'Remove "After N people submit..." copy from modal',
        auto_fixable: true,
      });
    }
  }
}
