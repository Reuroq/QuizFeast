import { NextResponse } from 'next/server';
import { createForm, listForms, FIELD_TYPES } from '@/lib/forms-db';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const forms = listForms();
  return NextResponse.json({ forms });
}

export async function POST(request) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { title, description, schema, settings } = body;
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const cleanSchema = sanitizeSchema(schema);
  const form = createForm({ title: title.slice(0, 200), description: (description || '').slice(0, 2000), schema: cleanSchema, settings: settings || {} });
  return NextResponse.json({ form });
}

function sanitizeSchema(schema) {
  if (!Array.isArray(schema)) return [];
  return schema.slice(0, 100).map((f, i) => {
    const type = FIELD_TYPES.includes(f?.type) ? f.type : 'text';
    return {
      id: typeof f?.id === 'string' && f.id ? f.id : `field_${i + 1}`,
      type,
      label: String(f?.label || `Field ${i + 1}`).slice(0, 200),
      required: !!f?.required,
      placeholder: String(f?.placeholder || '').slice(0, 200),
      helpText: String(f?.helpText || '').slice(0, 500),
      options: Array.isArray(f?.options)
        ? f.options.slice(0, 50).map(o => String(o).slice(0, 100))
        : [],
    };
  });
}
