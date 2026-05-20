import { NextResponse } from 'next/server';
import { getForm, updateForm, deleteForm, FIELD_TYPES } from '@/lib/forms-db';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  // Public read of FORM SCHEMA is allowed — the form must be embeddable.
  // We never expose submissions here; that's a separate authed route.
  const form = getForm(params.id);
  if (!form) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Strip notify_webhook from public response (it can hold a secret URL)
  const safeSettings = { ...(form.settings || {}) };
  delete safeSettings.notify_webhook;
  return NextResponse.json({
    form: {
      ...form,
      settings: isAuthed() ? form.settings : safeSettings,
    },
  });
}

export async function PUT(request, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const updates = {};
  if (typeof body.title === 'string') updates.title = body.title.slice(0, 200);
  if (typeof body.description === 'string') updates.description = body.description.slice(0, 2000);
  if (Array.isArray(body.schema)) updates.schema = sanitizeSchema(body.schema);
  if (body.settings && typeof body.settings === 'object') updates.settings = body.settings;
  const form = updateForm(params.id, updates);
  if (!form) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ form });
}

export async function DELETE(request, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  deleteForm(params.id);
  return NextResponse.json({ ok: true });
}

function sanitizeSchema(schema) {
  return schema.slice(0, 100).map((f, i) => ({
    id: typeof f?.id === 'string' && f.id ? f.id : `field_${i + 1}`,
    type: FIELD_TYPES.includes(f?.type) ? f.type : 'text',
    label: String(f?.label || `Field ${i + 1}`).slice(0, 200),
    required: !!f?.required,
    placeholder: String(f?.placeholder || '').slice(0, 200),
    helpText: String(f?.helpText || '').slice(0, 500),
    options: Array.isArray(f?.options) ? f.options.slice(0, 50).map(o => String(o).slice(0, 100)) : [],
  }));
}
