/**
 * Serve historical Wufoo file attachments from the persistent disk.
 *
 * Submissions imported from Wufoo were rewritten to reference
 * /wufoo_attachments/<cabinet-id>/<filename>. This route streams those
 * files out of DATA_DIR/wufoo_attachments/ so the saved URLs keep working
 * after the Wufoo account is closed.
 *
 * Admin-only by default — these are private form submissions. Flip to
 * public by removing the isAuthed() check if any are user-facing.
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const PERSISTENT_ROOT = '/app/data';
const DATA_DIR = existsSync(PERSISTENT_ROOT) ? PERSISTENT_ROOT : join(process.cwd(), 'data');
const ATTACH_DIR = join(DATA_DIR, 'wufoo_attachments');

function mimeType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    txt: 'text/plain; charset=utf-8',
    csv: 'text/csv',
    json: 'application/json',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }[ext] || 'application/octet-stream';
}

export async function GET(request, { params }) {
  if (!isAuthed()) {
    return new Response('unauthorized', { status: 401 });
  }
  // Path traversal guard — UUIDv4 + filename without slashes
  if (!/^[a-f0-9-]{36}$/i.test(params.id)) return new Response('bad id', { status: 400 });
  if (/[/\\]/.test(params.filename) || params.filename.includes('..')) {
    return new Response('bad filename', { status: 400 });
  }
  const filePath = join(ATTACH_DIR, params.id, params.filename);
  if (!existsSync(filePath)) return new Response('not found', { status: 404 });
  const stat = statSync(filePath);
  const buf = readFileSync(filePath);
  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': mimeType(params.filename),
      'content-length': String(stat.size),
      'content-disposition': `inline; filename="${params.filename}"`,
    },
  });
}
