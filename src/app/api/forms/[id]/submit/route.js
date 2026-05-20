import { NextResponse } from 'next/server';
import { getForm, createSubmission, validateSubmission, countSubmissions } from '@/lib/forms-db';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const form = getForm(params.id);
  if (!form || form.archived) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const ua = request.headers.get('user-agent') || '';

  const rl = rateLimit(`form:${form.id}:${ip}`, { tokens: 5, refillMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const data = body?.data && typeof body.data === 'object' ? body.data : {};

  // Hard cap: max 1000 chars per field, max 50 fields submitted
  const clean = {};
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    if (count >= 50) break;
    if (typeof v === 'string') clean[k] = v.slice(0, 5000);
    else if (typeof v === 'number' || typeof v === 'boolean') clean[k] = v;
    else if (Array.isArray(v)) clean[k] = v.slice(0, 20).map(x => String(x).slice(0, 500));
    else if (v != null) clean[k] = String(v).slice(0, 5000);
    count++;
  }

  // Honeypot — if a hidden field named _hp is filled, silently accept and drop.
  if (clean._hp) {
    return NextResponse.json({ ok: true });
  }
  delete clean._hp;

  const errors = validateSubmission(form, clean);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'validation', errors }, { status: 400 });
  }

  // Optional submission cap
  if (form.settings?.max_submissions && countSubmissions(form.id) >= form.settings.max_submissions) {
    return NextResponse.json({ error: 'closed', message: 'This form is no longer accepting responses.' }, { status: 410 });
  }

  const sub = createSubmission(form.id, { data: clean, ip, userAgent: ua });

  // Fire-and-forget webhook notification (don't block response)
  const webhook = form.settings?.notify_webhook;
  if (webhook && /^https:\/\//i.test(webhook)) {
    fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'form.submission',
        form: { id: form.id, slug: form.slug, title: form.title },
        submission: { id: sub.id, data: sub.data, createdAt: sub.createdAt },
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    submissionId: sub.id,
    message: form.settings?.success_message || 'Thanks — your response was recorded.',
  });
}
