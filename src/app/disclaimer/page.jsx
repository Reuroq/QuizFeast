import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer | QuizFeast',
  description: 'QuizFeast is a free study reference. Answers are community-sourced and may be wrong. Always verify with your official training portal.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Disclaimer</h1>
        <p className="text-dark-500 text-sm mb-8">Effective May 20, 2026 · NightshiftLabs LLC</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">

          <section className="card p-5 border-amber-500/30 bg-amber-500/5">
            <h2 className="text-lg font-semibold text-amber-300 mb-2">Read This First</h2>
            <p>
              QuizFeast is a free study aid built from community submissions and publicly available study sets.
              Answers may be wrong, outdated, or incomplete. <strong>Always verify with your official training
              portal before you submit anything on a real test.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">No Affiliation</h2>
            <p>
              NightshiftLabs LLC, the operator of QuizFeast, is not affiliated with, sponsored by, or endorsed by
              the U.S. Department of Defense, any branch of the U.S. military, JKO, CDSE, ALMS, NKO, MarineNet,
              CompTIA, (ISC)², ISACA, EC-Council, AWS, Microsoft, Cisco, Quizlet, Chegg, Course Hero, or any
              other organization whose course names or trademarks appear on the Service. Trademarks are property
              of their respective owners and are used here solely to identify the subject of study material under
              nominative fair use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Educational Use Only</h2>
            <p>
              QuizFeast is for self-paced study and reference. It is not a substitute for official training,
              instructor guidance, or the authoritative content delivered through your organization&apos;s training
              portal. Use of QuizFeast content during live testing or in violation of your organization&apos;s
              training and testing policies is at your own risk. We take no responsibility for any disciplinary,
              academic, or professional consequences resulting from misuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Answers Are Not Guaranteed</h2>
            <p>
              Exam content changes year to year. Questions reworded slightly. Numerical thresholds get updated.
              An answer that was correct in 2023 may be obsolete in 2025. We cannot guarantee that any answer
              on QuizFeast matches the current official version of any exam, training, or certification.
            </p>
            <p className="mt-2">
              See the &ldquo;No Warranty&rdquo; section of our{' '}
              <Link href="/terms" className="text-brand-400 hover:text-brand-300 underline">Terms of Service</Link>{' '}
              for the full legal disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Report an Error</h2>
            <p>
              Found a wrong answer? Every Q&amp;A page has a &ldquo;Wrong answer? Report it&rdquo; link. We use
              community input to improve accuracy over time. Copyright concerns go through our{' '}
              <Link href="/dmca" className="text-brand-400 hover:text-brand-300 underline">DMCA process</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
