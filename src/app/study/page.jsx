import StudyAssistant from '@/components/StudyAssistant';

export const metadata = {
  title: 'AI Study Assistant — Paste Questions, Find Related | QuizFeast',
  description: 'Paste 2–3 questions you\'re stuck on. Our AI identifies the exam, finds related practice from across the corpus, and writes a study brief. Free, ad-free, no login.',
  alternates: { canonical: '/study' },
};

export default function StudyPage() {
  return <StudyAssistant />;
}
