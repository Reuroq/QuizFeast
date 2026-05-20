import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | QuizFeast',
  description: 'Terms of Service for QuizFeast — a study and answer-key reference site operated by Nightshift Labs LLC.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-dark-500 text-sm mb-8">Effective May 20, 2026 · Operator: Nightshift Labs LLC, Nevada</p>

        <div className="space-y-8 text-dark-300 leading-relaxed">
          <section>
            <p className="text-amber-300/80 text-sm border-l-2 border-amber-500/40 pl-4 italic">
              Read this carefully. By accessing or using QuizFeast (the &ldquo;Service&rdquo;), you agree to these
              Terms of Service. If you don&apos;t agree, don&apos;t use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              QuizFeast is operated by <strong>Nightshift Labs LLC</strong>, a limited liability company organized
              under the laws of the State of Nevada (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). The
              Service is available at quizfeast.onrender.com and any related subdomains.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What QuizFeast Is</h2>
            <p>
              QuizFeast is a free study reference for self-paced learners taking computer-based training (CBT) and
              certification exams. We aggregate community-submitted and publicly available question/answer
              material, organize it by exam, and provide tools to search, study, and report inaccuracies.
            </p>
            <p className="mt-2">
              <strong>QuizFeast is for study and reference only.</strong> It is not a substitute for official
              training, instructor guidance, or organizational training portals. Use of QuizFeast content during
              live testing or in violation of your organization&apos;s training policy is solely at your own risk
              and responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. No Affiliation, No Endorsement</h2>
            <p>
              QuizFeast is <strong>not affiliated with, sponsored by, or endorsed by</strong> the U.S. Department
              of Defense, Joint Knowledge Online (JKO), Defense Counterintelligence and Security Agency (CDSE),
              Army Learning Management System (ALMS), Navy e-Learning (NKO), MarineNet, the Air Force, the Army,
              the Navy, the Marine Corps, the Coast Guard, the Space Force, CompTIA, (ISC)², ISACA, EC-Council,
              Amazon Web Services, Microsoft, Cisco, or any other organization
              referenced on the Service. All trademarks and exam names are the property of their respective
              owners and are used here under nominative fair use solely to identify the subject of study material.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. No Warranty — Answers May Be Wrong</h2>
            <p className="font-semibold text-white">
              ALL CONTENT IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED.
            </p>
            <p className="mt-2">
              Answers are community-sourced. They may be incomplete, outdated, or wrong. Exam content changes
              year to year and we cannot guarantee that any answer matches the current official version. You
              are solely responsible for verifying any answer with your organization&apos;s authoritative
              training portal before relying on it. We disclaim all warranties of merchantability, fitness for a
              particular purpose, accuracy, and non-infringement to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Submissions</h2>
            <p>
              When you submit a correction or any other content to QuizFeast (a &ldquo;Submission&rdquo;), you
              grant Nightshift Labs LLC a worldwide, royalty-free, perpetual, irrevocable, sublicensable license
              to use, reproduce, modify, display, and distribute the Submission as part of the Service. You
              represent that your Submission does not infringe any third party&apos;s rights and that you have
              the legal right to submit it.
            </p>
            <p className="mt-2">
              We may modify, refuse, or remove any Submission at our sole discretion, including for accuracy,
              abuse, spam, or any other reason. Repeated abuse of correction systems may result in your access
              being blocked.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Copyright &amp; DMCA</h2>
            <p>
              We respect intellectual property rights. If you believe content on the Service infringes your
              copyright, please follow the procedure on our <Link href="/dmca" className="text-brand-400 hover:text-brand-300 underline">DMCA Policy</Link> page. Repeat
              infringers will have their submissions removed and access terminated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any policy applicable to you</li>
              <li>Scrape, crawl, or systematically extract content from the Service without our written consent</li>
              <li>Reverse engineer, disassemble, or attempt to derive source code from the Service</li>
              <li>Submit content you don&apos;t have the right to submit, or content that is misleading, malicious, or abusive</li>
              <li>Attempt to manipulate the community correction system through coordinated false submissions</li>
              <li>Interfere with the Service&apos;s security, performance, or other users&apos; access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="font-semibold text-white">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NIGHTSHIFTLABS LLC AND ITS OFFICERS, MEMBERS, EMPLOYEES, AND
              AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES,
              OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-2">
              Our total aggregate liability arising out of or relating to these Terms or the Service shall not
              exceed one hundred U.S. dollars (US$100). Some jurisdictions don&apos;t allow these limitations;
              in such jurisdictions, our liability is limited to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Nightshift Labs LLC and its officers, members,
              employees, and agents from and against any claims, damages, costs, and expenses (including
              reasonable attorneys&apos; fees) arising out of your use of the Service, your Submissions, or
              your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Arbitration &amp; Class-Action Waiver</h2>
            <p>
              Any dispute, claim, or controversy arising out of or relating to these Terms or the Service will be
              resolved by <strong>binding individual arbitration</strong> administered by the American Arbitration
              Association (AAA) under its Consumer Arbitration Rules. The arbitration shall be conducted in Clark
              County, Nevada, or by remote hearing at the arbitrator&apos;s discretion.
            </p>
            <p className="mt-2">
              <strong>You waive any right to participate in a class action or class arbitration.</strong> All claims must
              be brought in your individual capacity. If a court finds the class-action waiver unenforceable, the entire
              arbitration clause is null and the dispute will be litigated in the courts of Nevada.
            </p>
            <p className="mt-2 text-sm text-dark-500">
              You may opt out of arbitration by emailing us within 30 days of first using the Service with subject
              line &ldquo;Arbitration Opt-Out&rdquo;.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law &amp; Venue</h2>
            <p>
              These Terms are governed by the laws of the <strong>State of Nevada</strong>, without regard to its
              conflict-of-laws principles. Any matter not subject to arbitration shall be litigated exclusively in
              the state or federal courts located in Clark County, Nevada, and you consent to personal jurisdiction
              there.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, for any reason, without notice.
              On termination, sections 4 (No Warranty), 5 (Submissions license), 6 (Copyright), 8 (Liability),
              9 (Indemnification), 10 (Arbitration), 11 (Governing Law), and 13 (Miscellaneous) survive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Miscellaneous</h2>
            <p>
              These Terms are the entire agreement between you and us regarding the Service. If any provision is
              found unenforceable, the rest will remain in effect. Our failure to enforce a provision is not a
              waiver. You may not assign these Terms; we may. We may update these Terms at any time by posting a
              revised version; your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact</h2>
            <p>
              Questions about these Terms? Email <a href="mailto:dwaynemorise007@gmail.com" className="text-brand-400 hover:text-brand-300 underline">dwaynemorise007@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
