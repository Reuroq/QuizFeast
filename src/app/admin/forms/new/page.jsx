'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormBuilder from '@/components/FormBuilder';

export default function NewForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save(payload) {
    setSaving(true);
    setErr('');
    const r = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.status === 401) { location.href = '/admin/login'; return; }
    const j = await r.json();
    if (!r.ok) { setErr(j.error || 'Save failed'); return; }
    router.push(`/admin/forms/${j.form.id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">New form</h1>
      {err ? <div className="text-red-600 mb-3">{err}</div> : null}
      <FormBuilder onSave={save} saving={saving} />
    </div>
  );
}
