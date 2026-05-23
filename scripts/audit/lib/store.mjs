// Issue store for the audit pipeline. JSON-backed, keyed by deterministic
// fingerprint (so re-running deduplicates instead of piling up).
//
// Issue schema:
//   id          — stable hash of (agent + category + url + sub-key)
//   agent       — which agent found it (functional, legal, content, ...)
//   category    — short label (broken-link, banned-term, dup-qa, ...)
//   severity    — low | medium | high | critical
//   url         — full URL or null for non-URL findings
//   message     — short human description
//   evidence    — { kind: 'text'|'screenshot'|'trace', value: string }
//   suggested_fix — short string, optional
//   auto_fixable — bool, defaults false
//   discovered_at — ISO timestamp
//   fixed_at    — ISO timestamp or null (after auto-fix lands)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const STORE_DIR = path.join(process.cwd(), 'scripts', 'audit', 'state');
const ISSUES_FILE = path.join(STORE_DIR, 'issues.json');
const RUN_LOG_FILE = path.join(STORE_DIR, 'runs.json');

fs.mkdirSync(STORE_DIR, { recursive: true });

function fingerprint(parts) {
  const s = parts.filter(Boolean).join('|');
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
}

function loadIssues() {
  if (!fs.existsSync(ISSUES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf8')); }
  catch { return []; }
}

function saveIssues(issues) {
  fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2));
}

export class AuditStore {
  constructor() {
    this.issues = loadIssues();
    this._index = new Map();
    for (const it of this.issues) this._index.set(it.id, it);
  }

  // Add or merge an issue. Returns the issue id.
  report({ agent, category, severity = 'medium', url = null, message,
           evidence = null, suggested_fix = null, auto_fixable = false,
           sub_key = '' }) {
    const id = fingerprint([agent, category, url, sub_key]);
    const now = new Date().toISOString();
    if (this._index.has(id)) {
      const existing = this._index.get(id);
      existing.last_seen_at = now;
      existing.occurrences = (existing.occurrences || 1) + 1;
      // Refresh details if they changed
      existing.severity = severity;
      existing.message = message;
      if (evidence) existing.evidence = evidence;
      if (suggested_fix) existing.suggested_fix = suggested_fix;
      existing.auto_fixable = auto_fixable;
      return id;
    }
    const issue = {
      id, agent, category, severity, url, message,
      evidence, suggested_fix, auto_fixable,
      discovered_at: now, last_seen_at: now, fixed_at: null, occurrences: 1,
    };
    this.issues.push(issue);
    this._index.set(id, issue);
    return id;
  }

  markFixed(id) {
    const it = this._index.get(id);
    if (!it) return false;
    it.fixed_at = new Date().toISOString();
    return true;
  }

  // All issues, optionally filtered
  query({ agent = null, severity = null, fixed = null } = {}) {
    return this.issues.filter(it => {
      if (agent && it.agent !== agent) return false;
      if (severity && it.severity !== severity) return false;
      if (fixed === true && !it.fixed_at) return false;
      if (fixed === false && it.fixed_at) return false;
      return true;
    });
  }

  stats() {
    const open = this.issues.filter(it => !it.fixed_at);
    const bySeverity = {};
    const byAgent = {};
    const byCategory = {};
    for (const it of open) {
      bySeverity[it.severity] = (bySeverity[it.severity] || 0) + 1;
      byAgent[it.agent] = (byAgent[it.agent] || 0) + 1;
      byCategory[it.category] = (byCategory[it.category] || 0) + 1;
    }
    return {
      total: this.issues.length,
      open: open.length,
      fixed: this.issues.length - open.length,
      by_severity: bySeverity,
      by_agent: byAgent,
      by_category: byCategory,
    };
  }

  persist() {
    saveIssues(this.issues);
  }
}

export function logRun({ started_at, finished_at, agents, urls_audited, issues_found }) {
  const runs = fs.existsSync(RUN_LOG_FILE)
    ? JSON.parse(fs.readFileSync(RUN_LOG_FILE, 'utf8'))
    : [];
  runs.push({ started_at, finished_at, agents, urls_audited, issues_found });
  // Keep last 100 runs
  while (runs.length > 100) runs.shift();
  fs.writeFileSync(RUN_LOG_FILE, JSON.stringify(runs, null, 2));
}
