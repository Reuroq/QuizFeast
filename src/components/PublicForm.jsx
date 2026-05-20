'use client';
import { useState } from 'react';

export default function PublicForm({ form }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  function setValue(id, v) {
    setValues((s) => ({ ...s, [id]: v }));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: undefined }));
  }

  function toggleCheckbox(id, opt) {
    setValues((s) => {
      const cur = Array.isArray(s[id]) ? s[id] : [];
      return { ...s, [id]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setGlobalError('');
    const r = await fetch(`/api/forms/${form.id}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: values }),
    });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    if (r.status === 429) {
      setGlobalError('Too many submissions. Please wait a moment and try again.');
      return;
    }
    if (r.status === 410) {
      setGlobalError(j.message || 'This form is no longer accepting responses.');
      return;
    }
    if (!r.ok) {
      if (j.errors) setErrors(j.errors);
      else setGlobalError(j.error || 'Submission failed');
      return;
    }
    setDone(true);
    setDoneMessage(j.message || 'Thanks — your response was recorded.');
  }

  if (done) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">{form.title}</h1>
        <p className="text-slate-600">{doneMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{form.title}</h1>
        {form.description ? (
          <p className="text-slate-600 mt-2 whitespace-pre-wrap">{form.description}</p>
        ) : null}
      </div>

      {/* Honeypot — hidden from real users, bots will fill it */}
      <input
        type="text"
        name="_hp"
        value={values._hp || ''}
        onChange={(e) => setValue('_hp', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', height: 0, width: 0 }}
        tabIndex={-1}
        autoComplete="off"
      />

      {form.schema.map((f) => (
        <div key={f.id}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {f.label}
            {f.required ? <span className="text-red-500 ml-1">*</span> : null}
          </label>
          {f.helpText ? <div className="text-xs text-slate-500 mb-1">{f.helpText}</div> : null}

          {f.type === 'textarea' ? (
            <textarea
              value={values[f.id] || ''}
              onChange={(e) => setValue(f.id, e.target.value)}
              placeholder={f.placeholder || ''}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              required={f.required}
            />
          ) : f.type === 'select' ? (
            <select
              value={values[f.id] || ''}
              onChange={(e) => setValue(f.id, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              required={f.required}
            >
              <option value="">Choose…</option>
              {(f.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : f.type === 'radio' ? (
            <div className="space-y-1">
              {(f.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-slate-900">
                  <input
                    type="radio"
                    name={f.id}
                    value={opt}
                    checked={values[f.id] === opt}
                    onChange={() => setValue(f.id, opt)}
                    required={f.required}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : f.type === 'checkbox' ? (
            <div className="space-y-1">
              {(f.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-slate-900">
                  <input
                    type="checkbox"
                    checked={Array.isArray(values[f.id]) && values[f.id].includes(opt)}
                    onChange={() => toggleCheckbox(f.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : f.type === 'date' ? 'date' : 'text'}
              value={values[f.id] || ''}
              onChange={(e) => setValue(f.id, e.target.value)}
              placeholder={f.placeholder || ''}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              required={f.required}
            />
          )}

          {errors[f.id] ? <div className="text-xs text-red-600 mt-1">{errors[f.id]}</div> : null}
        </div>
      ))}

      {globalError ? <div className="text-sm text-red-600">{globalError}</div> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
