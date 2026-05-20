'use client';
import { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
];

function newField(i) {
  return {
    id: `field_${Date.now()}_${i}`,
    type: 'text',
    label: '',
    required: false,
    placeholder: '',
    helpText: '',
    options: [],
  };
}

export default function FormBuilder({ initial, onSave, saving }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [fields, setFields] = useState(initial?.schema?.length ? initial.schema : [newField(0)]);
  const [settings, setSettings] = useState(initial?.settings || {});

  function updateField(i, patch) {
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeField(i) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }
  function addField() {
    setFields((f) => [...f, newField(f.length)]);
  }
  function moveField(i, dir) {
    setFields((f) => {
      const a = [...f];
      const j = i + dir;
      if (j < 0 || j >= a.length) return a;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  }

  function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      schema: fields,
      settings,
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Form title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            placeholder="Contact us"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            placeholder="Shown at the top of the public form"
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Fields</h2>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-slate-400">#{i + 1}</span>
                <select
                  value={f.type}
                  onChange={(e) => updateField(i, { type: e.target.value })}
                  className="text-sm border border-slate-300 rounded px-2 py-1"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <label className="text-sm text-slate-600 flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={() => moveField(i, -1)} className="text-slate-400 hover:text-slate-700 text-sm">↑</button>
                  <button type="button" onClick={() => moveField(i, 1)} className="text-slate-400 hover:text-slate-700 text-sm">↓</button>
                  <button type="button" onClick={() => removeField(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>

              <input
                type="text"
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Question / field label"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mb-2"
              />

              <input
                type="text"
                value={f.placeholder || ''}
                onChange={(e) => updateField(i, { placeholder: e.target.value })}
                placeholder="Placeholder text (optional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mb-2 text-sm"
              />

              <input
                type="text"
                value={f.helpText || ''}
                onChange={(e) => updateField(i, { helpText: e.target.value })}
                placeholder="Help text (optional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mb-2 text-sm"
              />

              {(f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Options (one per line)</label>
                  <textarea
                    value={(f.options || []).join('\n')}
                    onChange={(e) => updateField(i, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm font-mono"
                    placeholder={'Option 1\nOption 2'}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addField}
          className="mt-3 text-sm text-slate-600 hover:text-slate-900"
        >
          + Add field
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Settings</h2>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Success message</label>
          <input
            type="text"
            value={settings.success_message || ''}
            onChange={(e) => setSettings({ ...settings, success_message: e.target.value })}
            placeholder="Thanks — your response was recorded."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Notify webhook URL (optional)</label>
          <input
            type="url"
            value={settings.notify_webhook || ''}
            onChange={(e) => setSettings({ ...settings, notify_webhook: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">Each submission will POST JSON here. Discord/Slack/Zapier compatible.</p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Max submissions (0 = unlimited)</label>
          <input
            type="number"
            value={settings.max_submissions || 0}
            onChange={(e) => setSettings({ ...settings, max_submissions: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
            min={0}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save form'}
      </button>
    </form>
  );
}
