/**
 * Download Wufoo cabinet attachments before account cancellation.
 *
 * Reads all submissions, finds cabinet URLs, follows the 307 redirect to
 * pre-signed S3, downloads to data/wufoo_attachments/. Also rewrites the
 * submission to reference the local file path.
 *
 * Run BEFORE you cancel Wufoo — once the account closes the cabinet
 * redirects stop working and the files are gone.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const PERSISTENT_ROOT = '/app/data';
const DATA_DIR = existsSync(PERSISTENT_ROOT) ? PERSISTENT_ROOT : join(process.cwd(), 'data');
const ATTACH_DIR = join(DATA_DIR, 'wufoo_attachments');
const SUBS_DIR = join(DATA_DIR, 'submissions');
mkdirSync(ATTACH_DIR, { recursive: true });

const FORMS_FILE = join(DATA_DIR, 'forms.json');
const forms = JSON.parse(readFileSync(FORMS_FILE, 'utf8'));

// Only target the Wufoo-imported form
const wufooForms = forms.filter(f => f.settings?.imported_from === 'wufoo');
console.log(`Found ${wufooForms.length} Wufoo-imported form(s)`);

const CABINET_RE = /(https?:\/\/[^\s,;"']+\.wufoo\.com\/cabinet\/[a-f0-9-]+)/g;

async function downloadOne(cabinetUrl, destPath) {
  // First request — follow redirect manually to capture the S3 URL
  const head = await fetch(cabinetUrl, { redirect: 'manual' });
  if (head.status !== 307 && head.status !== 302) {
    throw new Error(`unexpected status ${head.status} for ${cabinetUrl}`);
  }
  const s3 = head.headers.get('location');
  if (!s3) throw new Error(`no location header for ${cabinetUrl}`);
  const fileRes = await fetch(s3);
  if (!fileRes.ok) throw new Error(`s3 ${fileRes.status} for ${s3.slice(0, 80)}`);
  // Filename from Content-Disposition
  const cd = fileRes.headers.get('content-disposition') || '';
  let filename = '';
  const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/);
  if (m) filename = decodeURIComponent(m[1]).trim();
  if (!filename) filename = 'unknown.bin';
  const finalPath = destPath.replace(/{filename}/, filename);
  mkdirSync(dirname(finalPath), { recursive: true });
  await pipeline(Readable.fromWeb(fileRes.body), (await import('fs')).createWriteStream(finalPath));
  return { filename, finalPath, size: Number(fileRes.headers.get('content-length') || 0) };
}

for (const form of wufooForms) {
  const subsFile = join(SUBS_DIR, `${form.id}.jsonl`);
  const lines = readFileSync(subsFile, 'utf8').split('\n').filter(Boolean);
  const subs = lines.map(l => JSON.parse(l));

  // Build job list
  const jobs = [];
  for (const sub of subs) {
    for (const [fieldId, value] of Object.entries(sub.data || {})) {
      if (typeof value !== 'string') continue;
      const matches = value.match(CABINET_RE);
      if (!matches) continue;
      for (const url of matches) {
        const id = url.split('/').pop();
        jobs.push({ subId: sub.id, fieldId, url, id, value });
      }
    }
  }

  console.log(`\nForm ${form.title}: ${jobs.length} attachment(s) to download`);

  // Download with limited concurrency
  const concurrency = 4;
  const urlToLocal = {};
  let done = 0;
  let failed = 0;

  async function worker(queue) {
    while (queue.length) {
      const job = queue.shift();
      try {
        const subDir = join(ATTACH_DIR, job.id);
        const result = await downloadOne(job.url, join(subDir, '{filename}'));
        urlToLocal[job.url] = `/wufoo_attachments/${job.id}/${result.filename}`;
        done++;
        process.stdout.write(`  [${done}/${jobs.length}] ${result.filename} (${result.size} bytes)\n`);
      } catch (e) {
        failed++;
        process.stdout.write(`  ! failed ${job.url}: ${e.message}\n`);
      }
    }
  }

  const queue = [...jobs];
  await Promise.all(Array.from({ length: concurrency }, () => worker(queue)));

  console.log(`\n  Done: ${done} succeeded, ${failed} failed`);

  // Rewrite submission values to point to local paths
  let rewritten = 0;
  for (const sub of subs) {
    for (const [fieldId, value] of Object.entries(sub.data || {})) {
      if (typeof value !== 'string') continue;
      let updated = value;
      const matches = value.match(CABINET_RE) || [];
      for (const url of matches) {
        if (urlToLocal[url]) {
          updated = updated.split(url).join(urlToLocal[url]);
        }
      }
      if (updated !== value) {
        sub.data[fieldId] = updated;
        rewritten++;
      }
    }
  }
  console.log(`  Rewrote ${rewritten} submission values to point at local paths`);

  // Save back to JSONL
  const tmp = subsFile + '.tmp';
  writeFileSync(tmp, subs.map(s => JSON.stringify(s)).join('\n') + '\n');
  renameSync(tmp, subsFile);
  console.log(`  Saved → ${subsFile}`);
}

console.log('\n✓ Done.');
