/**
 * One-time bundle restore endpoint.
 *
 * Accepts a tar.gz (multipart, field name "bundle") and unpacks it to
 * DATA_DIR. Used to migrate local form data + attachments onto the
 * Render persistent disk after first deploy.
 *
 * Admin-only — token check via cookie. Caller may also pass token
 * directly in `X-Admin-Token` header (lets the upload happen without
 * a browser cookie round-trip).
 *
 * REMOVE THIS ROUTE after the one-time migration is done.
 */
import { NextResponse } from 'next/server';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { isAuthed, verifyToken } from '@/lib/admin-auth';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PERSISTENT_ROOT = '/app/data';
const DATA_DIR = existsSync(PERSISTENT_ROOT) ? PERSISTENT_ROOT : join(process.cwd(), 'data');

function tarExtract(tarPath, destDir) {
  return new Promise((resolve, reject) => {
    const p = spawn('tar', ['-xzf', tarPath, '-C', destDir], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d.toString(); });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`tar exit ${code}: ${err}`)));
  });
}

export async function POST(request) {
  // Cookie OR header-based auth
  const headerToken = request.headers.get('x-admin-token');
  if (!isAuthed() && !verifyToken(headerToken)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ctype = request.headers.get('content-type') || '';
  if (!ctype.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'expected multipart/form-data with field "bundle"' }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get('bundle');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'missing field "bundle"' }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: 'empty bundle' }, { status: 400 });
  }
  if (buf.length > 500 * 1024 * 1024) {
    return NextResponse.json({ error: 'bundle too large (>500MB)' }, { status: 413 });
  }

  mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = join(tmpdir(), `bundle-${Date.now()}.tgz`);
  writeFileSync(tmpPath, buf);

  try {
    await tarExtract(tmpPath, DATA_DIR);
  } catch (e) {
    return NextResponse.json({ error: 'extract_failed', detail: String(e.message || e) }, { status: 500 });
  }

  // Return a quick health snapshot
  const formsFile = join(DATA_DIR, 'forms.json');
  const submissionsDir = join(DATA_DIR, 'submissions');
  const attachDir = join(DATA_DIR, 'wufoo_attachments');
  let report = {
    forms_file_exists: existsSync(formsFile),
    submissions_dir_exists: existsSync(submissionsDir),
    attachments_dir_exists: existsSync(attachDir),
  };
  try {
    if (report.forms_file_exists) {
      const { readFileSync } = await import('fs');
      report.forms_count = JSON.parse(readFileSync(formsFile, 'utf8')).length;
    }
    if (report.submissions_dir_exists) {
      const { readdirSync, readFileSync, statSync } = await import('fs');
      const files = readdirSync(submissionsDir).filter(f => f.endsWith('.jsonl'));
      report.submission_files = files.length;
      let total = 0;
      for (const f of files) {
        total += readFileSync(join(submissionsDir, f), 'utf8').split('\n').filter(Boolean).length;
      }
      report.total_submissions = total;
    }
    if (report.attachments_dir_exists) {
      const { readdirSync } = await import('fs');
      report.attachment_dirs = readdirSync(attachDir).length;
    }
  } catch (e) {
    report.report_error = String(e.message || e);
  }

  return NextResponse.json({ ok: true, report });
}
