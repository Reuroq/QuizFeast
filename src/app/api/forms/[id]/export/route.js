import { getForm, listSubmissions } from '@/lib/forms-db';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

function csvEscape(v) {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request, { params }) {
  if (!isAuthed()) {
    return new Response('unauthorized', { status: 401 });
  }
  const form = getForm(params.id);
  if (!form) return new Response('not found', { status: 404 });

  const subs = listSubmissions(form.id, { limit: 5000 });

  const fieldIds = (form.schema || []).map(f => f.id);
  const headers = ['submission_id', 'created_at', 'ip', ...fieldIds.map(id => {
    const f = form.schema.find(x => x.id === id);
    return f?.label || id;
  })];

  const lines = [headers.map(csvEscape).join(',')];
  for (const s of subs) {
    const row = [s.id, s.createdAt, s.ip, ...fieldIds.map(id => s.data?.[id])];
    lines.push(row.map(csvEscape).join(','));
  }

  const body = lines.join('\n');
  const filename = `${form.slug || 'form'}-${new Date().toISOString().slice(0,10)}.csv`;
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
