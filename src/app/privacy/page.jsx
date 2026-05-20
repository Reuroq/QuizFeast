import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | QuizFeast',
  description: 'Privacy Policy for QuizFeast. No accounts, no tracking cookies, no personal data collection. Operated by Nightshift Labs LLC.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-dark-500 text-sm mb-8">Effective May 20, 2026 · Nightshift Labs LLC</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">
          <section className="card p-5 bg-dark-800/40">
            <h2 className="text-lg font-semibold text-white mb-2">Short Version</h2>
            <p className="text-sm">
              QuizFeast doesn&apos;t require an account. We don&apos;t track you across the web. We don&apos;t
              set advertising cookies. The only thing your browser stores is a short list of which CBT pages
              you&apos;ve recently viewed (in tab-only memory, gone when you close the tab) so search results
              know what you&apos;re studying. That&apos;s it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. What We Collect</h2>
            <p>QuizFeast collects only what is needed to serve the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Standard server logs.</strong> When you visit a page, our hosting provider (Render) records
                the request: IP address, user agent, requested URL, timestamp, and response status. These are
                kept short-term for operational security and abuse prevention. We don&apos;t link them to a
                persistent identity.
              </li>
              <li>
                <strong>Tab-session memory (browser).</strong> When you visit an answer page, the URL slug of
                that CBT is stored in your browser&apos;s <code className="text-brand-300 text-xs">sessionStorage</code>{' '}
                (and similarly for section selections you make). This is used by the search bar on{' '}
                <Link href="/answers" className="text-brand-400 hover:text-brand-300 underline">/answers</Link>{' '}
                to bias results toward the CBT you appear to be studying. It is <strong>deleted when you close
                the tab</strong>. It is never sent to a third party except as a query parameter on our own
                search API while you&apos;re searching.
              </li>
              <li>
                <strong>Corrections you submit.</strong> When you use the &ldquo;Report wrong answer&rdquo;
                feature, the question text, the answer you suggest, and a deterministic identifier for that
                question are stored anonymously in our vector database (Pinecone). No name, no email, no IP.
              </li>
              <li>
                <strong>Search queries.</strong> Search queries you type on the Service are sent to our server
                so we can return matches. They are not associated with any persistent identity and are not used
                for advertising.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What We Do NOT Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your name, email, or any other personal identifier (we don&apos;t have user accounts)</li>
              <li>Advertising cookies, tracking pixels, or third-party analytics fingerprinting</li>
              <li>Your browsing history outside of QuizFeast</li>
              <li>Any data when you&apos;re not actively using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Cookies</h2>
            <p>
              QuizFeast does not set cookies for analytics or advertising. We use{' '}
              <code className="text-brand-300 text-xs">sessionStorage</code> (browser-local, tab-only) for the
              recent-CBT memory described above. We do not currently set persistent cookies for visitor tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We rely on the following providers to operate the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Render</strong> — hosting + standard server logs</li>
              <li><strong>OpenAI</strong> — text embeddings for semantic search</li>
              <li><strong>Anthropic (Claude)</strong> — natural-language features in the Service</li>
              <li><strong>Pinecone</strong> — vector storage for community corrections and search</li>
            </ul>
            <p className="mt-2">
              Each provider processes data under its own privacy policy. We send them only what they need to
              perform their function — no personal identifiers beyond what is necessary for the request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Children&apos;s Privacy</h2>
            <p>
              QuizFeast is not directed to children under 13. If you believe a child under 13 has used the
              Service in a way that involves their personal information, contact us and we will take appropriate
              action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>
              Since we don&apos;t maintain user accounts or persistent identifiers, there&apos;s very little
              individual data tied to you that we could surface or delete. If you believe a specific correction
              you submitted should be removed, contact us with enough detail to locate it and we&apos;ll process
              the request.
            </p>
            <p className="mt-2">
              California, EU/UK, and other-jurisdiction visitors have additional rights under their local
              privacy laws. Contact us to exercise them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The effective date above will be updated when
              we do. Material changes will be flagged on the home page or in the footer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
            <p>
              Privacy questions or requests? Email{' '}
              <a href="mailto:dwaynemorise007@gmail.com" className="text-brand-400 hover:text-brand-300 underline">
                dwaynemorise007@gmail.com
              </a>{' '}
              with subject &ldquo;Privacy&rdquo;.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Related</h2>
            <p>
              See also our <Link href="/terms" className="text-brand-400 hover:text-brand-300 underline">Terms of Service</Link>,{' '}
              <Link href="/disclaimer" className="text-brand-400 hover:text-brand-300 underline">Disclaimer</Link>, and{' '}
              <Link href="/dmca" className="text-brand-400 hover:text-brand-300 underline">DMCA Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
