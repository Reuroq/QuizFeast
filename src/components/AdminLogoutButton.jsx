'use client';

export default function AdminLogoutButton() {
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.href = '/admin/login';
  }
  return (
    <button onClick={logout} className="text-sm text-slate-600 hover:text-red-600">
      Log out
    </button>
  );
}
