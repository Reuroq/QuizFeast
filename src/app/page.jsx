import Link from 'next/link';
import CBTSearch from '@/components/CBTSearch';

const cbtSections = [
  {
    title: 'DoD Annual Requirements',
    desc: 'Mandatory training every service member completes yearly',
    courses: [
      { slug: 'cyber_awareness', title: 'Cyber Awareness Challenge', desc: 'Phishing, social engineering, PII, spillage, CUI, and more', questions: 122, color: 'from-blue-500 to-cyan-500', badge: 'Most Popular' },
      { slug: 'insider_threat', title: 'Insider Threat Awareness', desc: 'Behavioral indicators, reporting, the 6 hotspots, and case studies', questions: 61, color: 'from-red-500 to-orange-500' },
      { slug: 'opsec', title: 'OPSEC Awareness', desc: '5-step OPSEC process, critical information, OSINT, countermeasures', questions: 61, color: 'from-emerald-500 to-green-500' },
      { slug: 'antiterrorism', title: 'Antiterrorism Level 1', desc: 'FPCON levels, active shooter, IED recognition, iSALUTE, travel security', questions: 61, color: 'from-yellow-500 to-amber-500' },
      { slug: 'sapr', title: 'SAPR', desc: 'Restricted/unrestricted reporting, SARC role, bystander intervention, SAFE exam', questions: 42, color: 'from-pink-500 to-rose-500' },
      { slug: 'suicide_prevention', title: 'Suicide Prevention', desc: 'ACE model, warning signs, risk factors, Military Crisis Line, QPR', questions: 43, color: 'from-violet-500 to-purple-500' },
      { slug: 'ctip', title: 'Combating Trafficking in Persons', desc: 'Trafficking indicators, DoD zero-tolerance policy, reporting procedures', questions: 50, color: 'from-pink-400 to-rose-600' },
      { slug: 'equal_opportunity', title: 'Equal Opportunity', desc: 'Protected categories, harassment, hostile work environment, MEO vs EEO', questions: 41, color: 'from-sky-500 to-blue-500' },
      { slug: 'ethics', title: 'DoD Ethics', desc: 'Gift rules ($20/$50), Hatch Act, financial disclosure, government resources', questions: 40, color: 'from-amber-500 to-yellow-600' },
      { slug: 'dod_annual_security', title: 'Annual Security Awareness', desc: 'Insider threat, counterintelligence, suspicious contacts, social media risks', questions: 39, color: 'from-gray-400 to-slate-500' },
    ],
  },
  {
    title: 'Security & Intelligence',
    desc: 'Cybersecurity, information security, and counterintelligence',
    courses: [
      { slug: 'information_security', title: 'Information Security', desc: 'Classification levels, derivative classification, SF-86, need-to-know, markings', questions: 42, color: 'from-slate-400 to-zinc-500' },
      { slug: 'cui', title: 'Controlled Unclassified Information', desc: 'CUI categories, marking, safeguarding, NARA registry, NIST 800-171', questions: 41, color: 'from-blue-400 to-indigo-500' },
      { slug: 'dod_cyber_fundamentals', title: 'Cyber Fundamentals', desc: 'PKI, CAC, STIG, RMF, ATO process, FISMA, incident response', questions: 41, color: 'from-cyan-500 to-blue-600' },
      { slug: 'tarp', title: 'TARP', desc: 'Foreign intelligence threats, elicitation, suspicious contacts, CI reporting', questions: 44, color: 'from-indigo-500 to-blue-600' },
      { slug: 'pii_training', title: 'PII Training', desc: 'PII/PHI definitions, breach reporting, safeguarding, encryption, disposal', questions: 40, color: 'from-purple-400 to-violet-500' },
      { slug: 'force_protection', title: 'Force Protection', desc: 'Physical security, access control, bomb threats, RAM, evacuation', questions: 39, color: 'from-teal-500 to-cyan-600' },
    ],
  },
  {
    title: 'JKO Courses',
    desc: 'Joint Knowledge Online mandatory and elective courses',
    courses: [
      { slug: 'sejpme', title: 'SEJPME I', desc: 'Joint operations, unified command, combatant commands, joint planning process', questions: 48, color: 'from-emerald-500 to-teal-500' },
      { slug: 'law_of_war', title: 'Law of War', desc: 'Geneva Conventions, ROE, targeting principles, war crimes reporting', questions: 56, color: 'from-slate-400 to-zinc-500' },
      { slug: 'sere', title: 'SERE 100.2', desc: 'Code of Conduct, survival, evasion, resistance, escape, captivity', questions: 50, color: 'from-lime-500 to-emerald-600' },
      { slug: 'cbrn', title: 'CBRN Awareness', desc: 'MOPP levels, chemical/bio/rad/nuclear agents, decontamination', questions: 50, color: 'from-orange-500 to-red-600' },
      { slug: 'wmd', title: 'Combating WMD', desc: 'Proliferation threats, counterproliferation, detection, treaty compliance', questions: 36, color: 'from-red-500 to-rose-600' },
      { slug: 'trafficking_awareness', title: 'Human Trafficking Awareness', desc: 'Labor/sex trafficking, TVPA, TIP report tiers, victim identification', questions: 36, color: 'from-pink-500 to-fuchsia-500' },
      { slug: 'driving_for_life', title: 'Driving for Life', desc: 'Distracted driving, DUI, motorcycle safety, fatigue, TRiPS system', questions: 40, color: 'from-green-500 to-emerald-500' },
    ],
  },
  {
    title: 'Health & Safety',
    desc: 'Medical, safety, and readiness training',
    courses: [
      { slug: 'hipaa_privacy', title: 'HIPAA & Privacy Act', desc: 'PHI, breach notification, patient rights, minimum necessary, penalties', questions: 58, color: 'from-purple-500 to-violet-500' },
      { slug: 'first_aid', title: 'TCCC / Military First Aid', desc: 'MARCH algorithm, tourniquet, wound packing, 9-line MEDEVAC, chest seals', questions: 54, color: 'from-red-400 to-rose-500' },
      { slug: 'hazmat', title: 'HAZMAT / HAZCOM', desc: 'GHS labels, SDS sections, PPE, chemical storage, spill response', questions: 41, color: 'from-yellow-500 to-orange-500' },
      { slug: 'risk_management', title: 'Composite Risk Management', desc: '5-step CRM, risk matrix, hazard ID, controls, residual risk, AAR', questions: 41, color: 'from-amber-400 to-orange-500' },
      { slug: 'domestic_violence', title: 'Domestic Violence / FAP', desc: 'Warning signs, safety planning, FAP referral, military protective orders', questions: 36, color: 'from-rose-400 to-pink-500' },
    ],
  },
  {
    title: 'Service-Specific',
    desc: 'Army, Air Force, Navy, and Marine Corps training',
    courses: [
      { slug: 'army_values', title: 'Army Values & Leadership', desc: 'LDRSHIP, Soldier\'s Creed, Warrior Ethos, NCO Creed, ADP 6-22', questions: 44, color: 'from-green-600 to-emerald-700' },
      { slug: 'sharp', title: 'Army SHARP', desc: 'Reporting options, 3 Ds intervention, AR 600-20, victim rights', questions: 51, color: 'from-yellow-500 to-green-600' },
      { slug: 'air_force_pme', title: 'Air Force PME / PDG', desc: 'Enlisted force, EPR, promotion, core values, AFI 36-2618, history', questions: 52, color: 'from-blue-600 to-sky-500' },
      { slug: 'navy_bmt', title: 'Navy GMT / BMR', desc: 'Ranks/rates, core values, watch standing, damage control, naval customs', questions: 50, color: 'from-blue-800 to-indigo-600' },
      { slug: 'ucmj', title: 'UCMJ Basics', desc: 'Punitive articles, Article 15/NJP, courts-martial, Article 31 rights', questions: 50, color: 'from-gray-500 to-slate-600' },
    ],
  },
  {
    title: 'Professional Development',
    desc: 'Records, finance, and career readiness',
    courses: [
      { slug: 'records_management', title: 'Records Management', desc: 'Federal Records Act, lifecycle, disposition, FOIA, Privacy Act', questions: 40, color: 'from-stone-400 to-zinc-500' },
      { slug: 'financial_readiness', title: 'Financial Readiness', desc: 'TSP, BAS/BAH, SCRA, predatory lending, SBP, emergency savings', questions: 36, color: 'from-green-400 to-emerald-500' },
    ],
  },
];

const allCourses = cbtSections.flatMap(s => s.courses);

const features = [
  { icon: '\u{1F9E0}', title: 'AI-Powered Generation', desc: 'Upload any document \u2014 PDF, DOCX, notes, images \u2014 and our AI instantly creates study sets.' },
  { icon: '\u{1F3AF}', title: 'Smart Answer Checking', desc: 'AI understands synonyms, rephrasings, and equivalent answers. No rigid matching.' },
  { icon: '\u{1F4CA}', title: 'Real Spaced Repetition', desc: 'SM-2 algorithm adapts to your memory. Science-backed learning.' },
  { icon: '\u{1F50D}', title: 'Semantic Search', desc: 'Search 2M+ study materials by meaning, not just keywords.' },
  { icon: '\u{1F4DD}', title: 'Multiple Study Modes', desc: 'Flashcards, multiple choice, fill-in-the-blank \u2014 all free.' },
  { icon: '\u{1F4A1}', title: 'AI Explanations', desc: 'Get wrong? AI explains why the correct answer is right.' },
];

const comparisons = [
  { feature: 'All study modes', us: true, them: 'Paywalled' },
  { feature: 'AI question generation', us: true, them: 'Paid' },
  { feature: 'Spaced repetition', us: true, them: false },
  { feature: 'Smart answer matching', us: true, them: false },
  { feature: 'Document upload', us: true, them: false },
  { feature: 'AI explanations', us: true, them: 'Paid' },
  { feature: 'Ad-free', us: true, them: 'Paid' },
  { feature: 'Export your data', us: true, them: false },
  { feature: 'Semantic search', us: true, them: false },
];

export default function Home() {
  const totalQuestions = allCourses.reduce((sum, c) => sum + c.questions, 0);
  const totalCourses = allCourses.length;

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            100% Free — No Ads — No Paywalls
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Military CBT Answers
            <br />
            <span className="gradient-text">& Study Tools</span>
          </h1>

          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            {totalQuestions.toLocaleString()}+ questions and answers across {totalCourses} military CBTs.
            Cyber Awareness, OPSEC, SEJPME, JKO, and more. Free forever.
          </p>

          <CBTSearch className="mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="#cbt-library" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
              Browse All {totalCourses} CBTs
            </Link>
            <Link href="/search" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
              Search All Study Materials
            </Link>
          </div>

          {/* Hero preview card */}
          <div className="relative max-w-2xl mx-auto">
            <div className="card p-0 overflow-hidden shadow-2xl shadow-brand-500/10">
              <div className="bg-dark-800 px-4 py-3 flex items-center gap-2 border-b border-dark-700">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-dark-500 text-sm">Cyber Awareness Challenge — Q&A Mode</span>
              </div>
              <div className="p-8 sm:p-12">
                <div className="text-dark-500 text-sm mb-4 font-medium">QUESTION 7 of 122</div>
                <p className="text-2xl font-semibold text-white mb-8">
                  Which of the following is a best practice for telework security?
                </p>
                <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 text-brand-300">
                  Use your organization&apos;s VPN when connecting to work resources
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Military CBT Library */}
      <section id="cbt-library" className="py-24 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {totalCourses} Courses — {totalQuestions.toLocaleString()}+ Questions & Answers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Military CBT{' '}
              <span className="gradient-text">Answer Library</span>
            </h2>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              Every major DoD, JKO, and service-specific CBT. Click any course to see all questions and answers.
            </p>
          </div>

          {cbtSections.map((section, si) => (
            <div key={si} className="mt-14">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{section.title}</h3>
                <p className="text-dark-500 text-sm">{section.desc}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.courses.map((cbt) => (
                  <Link
                    key={cbt.slug}
                    href={`/cbt/${cbt.slug}`}
                    className="group relative card-hover overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cbt.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

                    {cbt.badge && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                        {cbt.badge}
                      </div>
                    )}

                    <div className="pt-5">
                      <h4 className="text-base font-bold text-white mb-1.5 group-hover:text-brand-300 transition-colors pr-20">
                        {cbt.title}
                      </h4>
                      <p className="text-dark-400 text-sm leading-relaxed mb-3">
                        {cbt.desc}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-500 text-xs font-medium">
                          {cbt.questions} questions
                        </span>
                        <span className="text-brand-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                          Study now &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-14">
            <Link href="/search" className="btn-secondary inline-block">
              Search 2M+ Study Materials
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for students who are{' '}
            <span className="gradient-text">tired of the BS</span>
          </h2>
          <p className="text-lg text-dark-400">
            Other apps put features behind paywalls. We put everything in your hands.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card-hover group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 relative">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              QuizFeast vs The Rest
            </h2>
            <p className="text-dark-400">See what you&apos;re actually getting</p>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="grid grid-cols-3 bg-dark-800 px-6 py-4 border-b border-dark-700">
              <div className="text-sm font-semibold text-dark-400">Feature</div>
              <div className="text-sm font-semibold text-brand-400 text-center">QuizFeast</div>
              <div className="text-sm font-semibold text-dark-500 text-center">Others</div>
            </div>
            {comparisons.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 ${i % 2 === 0 ? 'bg-dark-900/50' : ''} border-b border-dark-800/50`}>
                <div className="text-sm text-dark-200">{row.feature}</div>
                <div className="text-center">
                  {row.us === true ? (
                    <span className="text-green-400 font-semibold">Free</span>
                  ) : (
                    <span className="text-dark-500">{row.us}</span>
                  )}
                </div>
                <div className="text-center">
                  {row.them === true ? (
                    <span className="text-green-400">Yes</span>
                  ) : row.them === false ? (
                    <span className="text-red-400">No</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">{row.them}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Three ways to study
          </h2>
        </div>

        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">1</div>
            <h3 className="text-lg font-bold text-white mb-2">Upload Anything</h3>
            <p className="text-dark-400 text-sm">Drop a PDF, paste notes, or type Q&As manually. AI generates a complete study set in seconds.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">2</div>
            <h3 className="text-lg font-bold text-white mb-2">Choose Your Mode</h3>
            <p className="text-dark-400 text-sm">Flashcards with spaced repetition, multiple choice tests with AI-generated options, or fill-in-the-blank.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">3</div>
            <h3 className="text-lg font-bold text-white mb-2">Master It</h3>
            <p className="text-dark-400 text-sm">AI tracks what you know and surfaces what you don&apos;t. Get explanations for wrong answers. Real learning.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="card bg-gradient-to-br from-brand-900/50 to-dark-900 border-brand-700/30 py-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to actually learn?
            </h2>
            <p className="text-dark-400 mb-8 text-lg">
              No credit card. No ads. No catch. Just better studying.
            </p>
            <Link href="/create" className="btn-primary text-lg px-10 py-4 inline-block">
              Create Your First Study Set
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-md flex items-center justify-center font-bold text-white text-xs">
              Q
            </div>
            <span className="text-sm text-dark-500">QuizFeast — Free forever</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-dark-500">
            <Link href="/dashboard" className="hover:text-dark-300">My Sets</Link>
            <Link href="/create" className="hover:text-dark-300">Create</Link>
            <Link href="/search" className="hover:text-dark-300">Search</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
