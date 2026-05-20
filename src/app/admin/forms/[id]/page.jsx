'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import FormBuilder from '@/components/FormBuilder';

export default function EditForm({ params }) {
  const id = params.id;
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    refresh();
  }, [id]);

  async function refresh() {
    const r = await fetch(`/api/forms/${id}/submissions`);
    if (r.status === 401) { location.href = '/admin/login'; return; }
    const j = await r.json();
    if (j.error) { setErr(j.error); return; }
    setForm(j.form);
    setSubmissions(j.submissions);
    setTotal(j.total);
  }

  async function save(payload) {
    setSaving(true);
    setErr('');
    const r = await fetch(`/api/forms/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.status === 401) { location.href = '/admin/login'; return; }
    const j = await r.json();
    if (!r.ok) { setErr(j.error || 'Save failed'); return; }
    setForm(j.form);
  }

  async function deleteForm() {
    if (!confirm('Delete this form and all submissions? This cannot be undone.')) return;
    const r = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
    if (r.ok) location.href = '/admin/forms';
  }

  async function deleteSubmission(subId) {
    if (!confirm('Delete this submission?')) return;
    await fetch(`/api/forms/${id}/submissions/${subId}`, { method: 'DELETE' });
    refresh();
  }

  if (err) return <div className="text-red-600">Error: {err}</div>;
  if (!form) return <div className="text-slate-500">Loading…</div>;

  const publicUrl = typeof window !== 'undefined' ? `${location.origin}/f/${form.slug}` : `/f/${form.slug}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/admin/forms" className="text-sm text-slate-500 hover:text-slate-900">← All forms</Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{form.title}</h1>
          <div className="text-sm text-slate-500 mt-1">
            Public URL: <Link href={`/f/${form.slug}`} target="_blank" className="text-blue-600 hover:underline">{publicUrl}</Link>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className="ml-2 text-xs text-slate-400 hover:text-slate-700"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/forms/${id}/export`}
            className="text-sm bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            Export CSV
          </a>
          <button
            onClick={deleteForm}
            className="text-sm text-red-600 hover:text-red-800 border border-red-300 px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6 flex gap-6">
        <button
          onClick={() => setTab('edit')}
          className={`pb-2 text-sm font-medium ${tab === 'edit' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setTab('subs')}
          className={`pb-2 text-sm font-medium ${tab === 'subs' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}
        >
          Submissions ({total})
        </button>
      </div>

      {tab === 'edit' ? (
        <FormBuilder initial={form} onSave={save} saving={saving} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl">
          {submissions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No submissions yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {submissions.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleString()} · {s.ip}
                    </div>
                    <button
                      onClick={() => deleteSubmission(s.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.schema.map((f) => (
                      <div key={f.id}>
                        <div className="text-xs text-slate-500">{f.label}</div>
                        <div className="text-sm text-slate-900 whitespace-pre-wrap">
                          {Array.isArray(s.data[f.id])
                            ? s.data[f.id].join(', ')
                            : (s.data[f.id] || <span className="text-slate-300">—</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
