import { NextResponse } from 'next/server';
import { deleteSubmission, getSubmission } from '@/lib/forms-db';
import { isAuthed } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sub = getSubmission(params.subId);
  if (!sub || sub.formId !== params.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  deleteSubmission(params.subId);
  return NextResponse.json({ ok: true });
}
