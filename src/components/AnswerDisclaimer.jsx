import Link from 'next/link';

export default function AnswerDisclaimer() {
  return (
    <div className="mb-6 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-200/80 text-xs leading-relaxed">
      Community-sourced. Answers may be wrong or out of date. Always verify with your
      official training portal before submitting. Not affiliated with any branch, agency, or vendor.{' '}
      <Link href="/disclaimer" className="underline hover:text-amber-100">Details</Link>.
    </div>
  );
}
