import Link from 'next/link';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export const metadata = {
  title: 'QuizFeast Admin',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/forms" className="font-semibold text-slate-900">QuizFeast Admin</Link>
            <Link href="/admin/forms" className="text-sm text-slate-600 hover:text-slate-900">Forms</Link>
          </div>
          <AdminLogoutButton />
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4">{children}</div>
    </div>
  );
}
