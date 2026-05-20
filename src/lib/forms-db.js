/**
 * Forms DB — Wufoo replacement, single-owner mode.
 *
 * JSON-file store. No native deps, works on any Node version, fast enough
 * for thousands of submissions per form. If we ever need real SQL we can
 * migrate to node:sqlite without changing the public API.
 *
 * Files live under DATA_DIR:
 *   forms.json                  — array of form definitions
 *   submissions/<form_id>.jsonl — one submission per line (append-only)
 *
 * DATA_DIR is /app/data when present (Render persistent disk), else ./data
 * (local dev). Writes are atomic via rename.
 */
import { randomUUID } from 'crypto';
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  appendFileSync,
  readdirSync,
} from 'fs';
import { join } from 'path';

const PERSISTENT_ROOT = '/app/data';
const DATA_DIR = existsSync(PERSISTENT_ROOT) ? PERSISTENT_ROOT : join(process.cwd(), 'data');
const SUBS_DIR = join(DATA_DIR, 'submissions');
mkdirSync(SUBS_DIR, { recursive: true });

const FORMS_FILE = join(DATA_DIR, 'forms.json');

// ── low-level file I/O ──────────────────────────────────────────────

function loadForms() {
  if (!existsSync(FORMS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(FORMS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveForms(forms) {
  const tmp = FORMS_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(forms, null, 2));
  renameSync(tmp, FORMS_FILE);
}

function submissionsFile(formId) {
  return join(SUBS_DIR, `${formId}.jsonl`);
}

function loadSubmissions(formId) {
  const f = submissionsFile(formId);
  if (!existsSync(f)) return [];
  const lines = readFileSync(f, 'utf8').split('\n').filter(Boolean);
  const out = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

function appendSubmission(formId, sub) {
  appendFileSync(submissionsFile(formId), JSON.stringify(sub) + '\n');
}

function rewriteSubmissions(formId, subs) {
  const f = submissionsFile(formId);
  const tmp = f + '.tmp';
  writeFileSync(tmp, subs.map(s => JSON.stringify(s)).join('\n') + (subs.length ? '\n' : ''));
  renameSync(tmp, f);
}

// ── helpers ─────────────────────────────────────────────────────────

function nowIso() { return new Date().toISOString(); }

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || randomUUID().slice(0, 8);
}

function uniqueSlug(base, existing) {
  const taken = new Set(existing.map(f => f.slug));
  if (!taken.has(base)) return base;
  let n = 1;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// ── Forms CRUD ──────────────────────────────────────────────────────

export function createForm({ title, description, schema, settings }) {
  const forms = loadForms();
  const id = randomUUID();
  const slug = uniqueSlug(slugify(title), forms);
  const now = nowIso();
  const form = {
    id,
    slug,
    title: String(title || '').slice(0, 200),
    description: String(description || '').slice(0, 2000),
    schema: schema || [],
    settings: settings || {},
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  forms.unshift(form);
  saveForms(forms);
  return form;
}

export function getForm(idOrSlug) {
  const forms = loadForms();
  return forms.find(f => f.id === idOrSlug || f.slug === idOrSlug) || null;
}

export function listForms({ includeArchived = false } = {}) {
  const forms = loadForms();
  return includeArchived ? forms : forms.filter(f => !f.archived);
}

export function updateForm(id, updates) {
  const forms = loadForms();
  const idx = forms.findIndex(f => f.id === id);
  if (idx === -1) return null;
  forms[idx] = {
    ...forms[idx],
    title: updates.title ?? forms[idx].title,
    description: updates.description ?? forms[idx].description,
    schema: updates.schema ?? forms[idx].schema,
    settings: updates.settings ?? forms[idx].settings,
    updatedAt: nowIso(),
  };
  saveForms(forms);
  return forms[idx];
}

export function archiveForm(id) {
  const forms = loadForms();
  const idx = forms.findIndex(f => f.id === id);
  if (idx === -1) return null;
  forms[idx].archived = true;
  forms[idx].updatedAt = nowIso();
  saveForms(forms);
  return forms[idx];
}

export function deleteForm(id) {
  const forms = loadForms();
  saveForms(forms.filter(f => f.id !== id));
  try {
    const f = submissionsFile(id);
    if (existsSync(f)) {
      // Wipe the file (instead of unlink, which can race on Windows)
      writeFileSync(f, '');
    }
  } catch {}
}

// ── Submissions ─────────────────────────────────────────────────────

export function createSubmission(formId, { data, ip, userAgent }) {
  const id = randomUUID();
  const sub = {
    id,
    formId,
    data: data || {},
    ip: ip || '',
    userAgent: userAgent || '',
    createdAt: nowIso(),
  };
  appendSubmission(formId, sub);
  return sub;
}

export function getSubmission(id) {
  // Scan all submission files (cheap — usually one form is hot)
  for (const file of readdirSync(SUBS_DIR)) {
    if (!file.endsWith('.jsonl')) continue;
    const formId = file.slice(0, -6);
    for (const s of loadSubmissions(formId)) {
      if (s.id === id) return s;
    }
  }
  return null;
}

export function listSubmissions(formId, { limit = 500, offset = 0 } = {}) {
  // Submissions are always appended in chronological order, so the file is
  // already sorted oldest→newest. Reversing gives newest-first without
  // tie-breaking issues when two land in the same millisecond.
  const all = loadSubmissions(formId);
  all.reverse();
  return all.slice(offset, offset + limit);
}

export function countSubmissions(formId) {
  return loadSubmissions(formId).length;
}

export function deleteSubmission(id) {
  for (const file of readdirSync(SUBS_DIR)) {
    if (!file.endsWith('.jsonl')) continue;
    const formId = file.slice(0, -6);
    const subs = loadSubmissions(formId);
    const filtered = subs.filter(s => s.id !== id);
    if (filtered.length !== subs.length) {
      rewriteSubmissions(formId, filtered);
      return true;
    }
  }
  return false;
}

// ── field validation ────────────────────────────────────────────────

export const FIELD_TYPES = ['text', 'textarea', 'email', 'number', 'url', 'select', 'radio', 'checkbox', 'date'];

export function validateSubmission(form, data) {
  const errors = {};
  for (const field of form.schema || []) {
    const v = data?.[field.id];
    if (field.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))) {
      errors[field.id] = 'Required';
      continue;
    }
    if (v === undefined || v === '') continue;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
      errors[field.id] = 'Invalid email';
    } else if (field.type === 'url' && !/^https?:\/\/.+/i.test(String(v))) {
      errors[field.id] = 'Invalid URL';
    } else if (field.type === 'number' && Number.isNaN(Number(v))) {
      errors[field.id] = 'Must be a number';
    }
  }
  return errors;
}
