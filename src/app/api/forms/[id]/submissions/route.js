import { NextResponse } from 'next/server';
import { getForm, listSubmissions, countSubmissions } from '@/lib/forms-db';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const form = getForm(params.id);
  if (!form) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const url = new URL(request.url);
  const limit = Math.min(500, Number(url.searchParams.get('limit') || 100));
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
  const submissions = listSubmissions(form.id, { limit, offset });
  const total = countSubmissions(form.id);
  return NextResponse.json({ form, submissions, total });
}
