import { getForm } from '@/lib/forms-db';
import { notFound } from 'next/navigation';
import PublicForm from '@/components/PublicForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const form = getForm(params.slug);
  if (!form) return { title: 'Form not found' };
  return {
    title: `${form.title} — QuizFeast`,
    description: form.description || `Respond to ${form.title}`,
    robots: 'noindex, nofollow',
  };
}

export default function FormPublicPage({ params }) {
  const form = getForm(params.slug);
  if (!form || form.archived) return notFound();
  // Strip server-only settings
  const safeSettings = { ...(form.settings || {}) };
  delete safeSettings.notify_webhook;
  const safeForm = { ...form, settings: safeSettings };
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <PublicForm form={safeForm} />
        <div className="text-center text-xs text-slate-400 mt-6">
          Powered by QuizFeast Forms
        </div>
      </div>
    </div>
  );
}
