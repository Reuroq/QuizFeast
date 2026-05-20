import Link from 'next/link';

export const metadata = {
  title: 'DMCA Policy | QuizFeast',
  description: 'Copyright takedown procedure for QuizFeast. Submit a DMCA notice if you believe content on the Service infringes your copyright.',
  alternates: { canonical: '/dmca' },
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">DMCA Copyright Policy</h1>
        <p className="text-dark-500 text-sm mb-8">Effective May 20, 2026 · NightshiftLabs LLC</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">
          <section>
            <p className="text-amber-300/80 text-sm border-l-2 border-amber-500/40 pl-4 italic">
              NightshiftLabs LLC respects intellectual property rights and complies with the Digital Millennium
              Copyright Act (DMCA). If you believe content on QuizFeast infringes your copyright, follow the
              procedure below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Filing a DMCA Takedown Notice</h2>
            <p>
              To file a takedown request, send a written notice to our designated DMCA agent (below) containing
              all of the following:
            </p>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              <li>A physical or electronic signature of the copyright owner or an authorized representative.</li>
              <li>Identification of the copyrighted work claimed to be infringed (e.g., the specific question, answer set, or course material, with sufficient detail to locate it).</li>
              <li>The exact URL(s) of the allegedly infringing material on QuizFeast.</li>
              <li>Your full name, mailing address, telephone number, and email address.</li>
              <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>
                A statement, made under penalty of perjury, that the information in the notice is accurate and
                that you are the copyright owner or are authorized to act on the owner&apos;s behalf.
              </li>
            </ol>
            <p className="mt-3 text-sm text-dark-500">
              Incomplete notices may delay processing. We may forward your notice (including your contact
              information) to the party who submitted the allegedly infringing content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Designated DMCA Agent</h2>
            <div className="card p-5 bg-dark-800/50">
              <p className="mb-1"><strong>Agent:</strong> NightshiftLabs LLC, DMCA Designated Agent</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:dwaynemorise007@gmail.com" className="text-brand-400 hover:text-brand-300 underline">dwaynemorise007@gmail.com</a></p>
              <p className="mb-1"><strong>Subject line:</strong> &ldquo;DMCA Takedown Notice&rdquo;</p>
              <p className="text-sm text-dark-500 mt-2">
                Mailing address available on request. NightshiftLabs LLC&apos;s DMCA designated agent is on file
                with the U.S. Copyright Office Directory.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Our Response to Notices</h2>
            <p>
              Upon receipt of a compliant DMCA notice, we will:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Promptly remove or disable access to the allegedly infringing material;</li>
              <li>Notify the user who submitted the content (if applicable); and</li>
              <li>Terminate the access of repeat infringers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Counter-Notice</h2>
            <p>
              If you believe your content was removed in error or as a result of a misidentification, you may
              file a counter-notice with our DMCA agent containing:
            </p>
            <ol className="list-decimal pl-6 mt-3 space-y-2">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material removed and its location before removal.</li>
              <li>
                A statement under penalty of perjury that you have a good-faith belief the material was removed
                as a result of mistake or misidentification.
              </li>
              <li>
                Your name, address, and phone number, and a statement that you consent to the jurisdiction of
                the federal court in the district where you live (or, if outside the U.S., any judicial district
                in which we may be found) and that you will accept service of process from the person who
                provided the original notification.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">False Claims</h2>
            <p>
              Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that content
              is infringing (or that it was removed in error) may be liable for damages. Don&apos;t file frivolous
              notices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Related</h2>
            <p>
              See also our <Link href="/terms" className="text-brand-400 hover:text-brand-300 underline">Terms of Service</Link>{' '}
              and <Link href="/privacy" className="text-brand-400 hover:text-brand-300 underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
