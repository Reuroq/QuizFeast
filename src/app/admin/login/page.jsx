'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setBusy(false);
    if (r.ok) {
      location.href = '/admin/forms';
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white shadow rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Admin login</h1>
        <p className="text-sm text-slate-500">Paste your <code className="bg-slate-100 px-1 py-0.5 rounded">ADMIN_TOKEN</code> to continue.</p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          autoFocus
        />
        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        <button
          type="submit"
          disabled={busy || !token}
          className="w-full bg-slate-900 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
