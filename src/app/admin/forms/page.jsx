'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminFormsList() {
  const [forms, setForms] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/forms').then(async (r) => {
      if (r.status === 401) { location.href = '/admin/login'; return; }
      const j = await r.json();
      if (j.error) setErr(j.error);
      else setForms(j.forms);
    });
  }, []);

  if (err) return <div className="text-red-600">Error: {err}</div>;
  if (forms === null) return <div className="text-slate-500">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Forms</h1>
        <Link
          href="/admin/forms/new"
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          + New form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No forms yet. Create your first one.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {forms.map((f) => (
            <div key={f.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/admin/forms/${f.id}`} className="font-medium text-slate-900 hover:underline">
                  {f.title}
                </Link>
                <div className="text-sm text-slate-500">
                  Public URL: <Link href={`/f/${f.slug}`} target="_blank" className="text-blue-600 hover:underline">
                    /f/{f.slug}
                  </Link>
                  {' · '}
                  {f.schema?.length || 0} fields
                </div>
              </div>
              <Link href={`/admin/forms/${f.id}`} className="text-sm text-slate-600 hover:text-slate-900">
                Edit →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
