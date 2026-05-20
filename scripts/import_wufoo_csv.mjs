/**
 * Wufoo CSV → QuizFeast forms importer.
 *
 * Reads a Wufoo "Export to CSV" export and creates a matching form +
 * submissions in the new forms store. Preserves original Wufoo entry IDs
 * and timestamps so historical data round-trips cleanly.
 *
 * Usage:
 *   node scripts/import_wufoo_csv.mjs <path-to-csv>
 *   node scripts/import_wufoo_csv.mjs <path-to-csv> --title "Custom Title"
 *   node scripts/import_wufoo_csv.mjs <path-to-csv> --dry-run
 */
import { readFileSync, existsSync, writeFileSync, appendFileSync, mkdirSync, renameSync } from 'fs';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';

// ── arg parsing ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const csvPath = args.find(a => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const titleFlag = args.indexOf('--title');
const customTitle = titleFlag >= 0 ? args[titleFlag + 1] : null;

if (!csvPath || !existsSync(csvPath)) {
  console.error('Usage: node scripts/import_wufoo_csv.mjs <path-to-csv> [--title "..."] [--dry-run]');
  process.exit(1);
}

// ── RFC 4180 CSV parser (handles quoted fields with newlines + escaped quotes) ─
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  // flush final field/row
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const csvText = readFileSync(csvPath, 'utf8');
const rows = parseCSV(csvText);
if (rows.length < 1) {
  console.error('Empty CSV');
  process.exit(1);
}

const headers = rows[0];
const dataRows = rows.slice(1).filter(r => r.length > 1 && r.some(c => c !== ''));

console.log(`Parsed ${dataRows.length} entries with ${headers.length} columns`);
console.log('Columns:', headers.join(' | '));

// ── classify columns ────────────────────────────────────────────────
const META_COLS = new Set([
  'Entry Id', 'Date Created', 'Created By', 'Date Updated',
  'Updated By', 'IP Address', 'Last Page Accessed', 'Completion Status',
]);

function colIdx(name) { return headers.indexOf(name); }

const idxEntryId = colIdx('Entry Id');
const idxDateCreated = colIdx('Date Created');
const idxIp = colIdx('IP Address');

const fieldColumns = headers
  .map((h, i) => ({ header: h, index: i }))
  .filter(c => !META_COLS.has(c.header));

console.log('\nField columns:', fieldColumns.map(c => c.header).join(', '));

// ── infer field types from data ─────────────────────────────────────
function inferType(header, samples) {
  const hl = header.toLowerCase();
  if (hl === 'email' || hl.includes('e-mail')) return 'email';
  if (hl.includes('url') || hl.includes('website') || hl.includes('link')) return 'url';
  if (hl.includes('phone')) return 'text';
  // If any sample exceeds 200 chars or contains newlines, treat as textarea
  const long = samples.some(s => (s || '').length > 200 || (s || '').includes('\n'));
  return long ? 'textarea' : 'text';
}

function slugifyId(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50) || 'field';
}

function nowIso() { return new Date().toISOString(); }

const samples = {};
for (const col of fieldColumns) samples[col.header] = [];
for (const row of dataRows.slice(0, 200)) {
  for (const col of fieldColumns) samples[col.header].push(row[col.index] || '');
}

const fieldIds = {};
const schema = fieldColumns.map((col, i) => {
  const id = slugifyId(col.header) || `field_${i + 1}`;
  // ensure unique
  let uniq = id;
  let n = 1;
  while (Object.values(fieldIds).includes(uniq)) { uniq = `${id}_${n++}`; }
  fieldIds[col.header] = uniq;
  return {
    id: uniq,
    type: inferType(col.header, samples[col.header]),
    label: col.header,
    required: false,
    placeholder: '',
    helpText: '',
    options: [],
  };
});

console.log('\nInferred schema:');
schema.forEach(f => console.log(`  ${f.id.padEnd(40)} ${f.type.padEnd(10)} ${f.label}`));

// ── parse Wufoo date format → ISO ───────────────────────────────────
function toIso(wufooDate) {
  if (!wufooDate) return nowIso();
  // "2025-03-12 06:28:28 -0800"
  const m = wufooDate.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\s*([+-]\d{4})?$/);
  if (!m) return nowIso();
  const [, y, mo, d, h, mi, s, tz] = m;
  const tzFmt = tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : 'Z';
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${tzFmt}`).toISOString();
}

// ── build form + submissions in-memory ──────────────────────────────
const formId = randomUUID();
const formTitle = customTitle || basename(csvPath, '.csv').replace(/[+_]/g, ' ').replace(/\s+/g, ' ').trim();
const form = {
  id: formId,
  slug: formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60),
  title: formTitle,
  description: `Imported from Wufoo CSV (${basename(csvPath)}). Original entry IDs preserved in submission metadata.`,
  schema,
  settings: {
    success_message: 'Thanks — your submission was recorded.',
    imported_from: 'wufoo',
    imported_at: nowIso(),
    imported_count: dataRows.length,
  },
  archived: false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
};

const submissions = [];
for (const row of dataRows) {
  const data = {};
  for (const col of fieldColumns) {
    const v = row[col.index] || '';
    if (v) data[fieldIds[col.header]] = v;
  }
  const sub = {
    id: randomUUID(),
    formId,
    data,
    ip: row[idxIp] || '',
    userAgent: 'wufoo-import',
    createdAt: toIso(row[idxDateCreated]),
    wufooEntryId: row[idxEntryId] || null,
  };
  submissions.push(sub);
}

// Sort oldest→newest so JSONL append order remains chronological (matches forms-db reverse-on-read)
submissions.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

console.log(`\nForm:           ${form.title}`);
console.log(`Slug:           ${form.slug}`);
console.log(`Submissions:    ${submissions.length}`);
console.log(`Date range:     ${submissions[0]?.createdAt || '-'} → ${submissions[submissions.length - 1]?.createdAt || '-'}`);

if (dryRun) {
  console.log('\n[dry-run] not writing anything');
  process.exit(0);
}

// ── write to DATA_DIR ───────────────────────────────────────────────
const PERSISTENT_ROOT = '/app/data';
const DATA_DIR = existsSync(PERSISTENT_ROOT) ? PERSISTENT_ROOT : join(process.cwd(), 'data');
const SUBS_DIR = join(DATA_DIR, 'submissions');
mkdirSync(SUBS_DIR, { recursive: true });

const FORMS_FILE = join(DATA_DIR, 'forms.json');
let forms = [];
if (existsSync(FORMS_FILE)) {
  try { forms = JSON.parse(readFileSync(FORMS_FILE, 'utf8')); } catch {}
}

// Ensure slug uniqueness
const taken = new Set(forms.map(f => f.slug));
if (taken.has(form.slug)) {
  let n = 1;
  while (taken.has(`${form.slug}-${n}`)) n++;
  form.slug = `${form.slug}-${n}`;
}

forms.unshift(form);
const tmpForms = FORMS_FILE + '.tmp';
writeFileSync(tmpForms, JSON.stringify(forms, null, 2));
renameSync(tmpForms, FORMS_FILE);
console.log(`\nWrote form definition → ${FORMS_FILE}`);

const SUBS_FILE = join(SUBS_DIR, `${formId}.jsonl`);
const stream = submissions.map(s => JSON.stringify(s)).join('\n') + '\n';
writeFileSync(SUBS_FILE, stream);
console.log(`Wrote ${submissions.length} submissions → ${SUBS_FILE}`);

console.log('\n✓ Import complete.');
console.log(`  Form ID:    ${formId}`);
console.log(`  Public URL: /f/${form.slug}`);
console.log(`  Admin URL:  /admin/forms/${formId}`);
