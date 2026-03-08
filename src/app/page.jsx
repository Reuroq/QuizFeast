import Link from 'next/link';

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Generation',
    desc: 'Upload any document — PDF, DOCX, notes, images — and our AI instantly creates study sets. No manual typing.',
  },
  {
    icon: '🎯',
    title: 'Smart Answer Checking',
    desc: 'No more rigid matching. Our AI understands synonyms, rephrasings, and equivalent answers. "Father Christmas" = "Santa Claus".',
  },
  {
    icon: '📊',
    title: 'Real Spaced Repetition',
    desc: 'SM-2 algorithm adapts to your memory. Cards you struggle with appear more often. Cards you know fade away. Science-backed.',
  },
  {
    icon: '🔍',
    title: 'Semantic Search',
    desc: 'Search our massive study library using AI. Find related content by meaning, not just keywords.',
  },
  {
    icon: '📝',
    title: 'Multiple Study Modes',
    desc: 'Flashcards, multiple choice tests, fill-in-the-blank, matching — all free. No paywalls hiding the good stuff.',
  },
  {
    icon: '💡',
    title: 'AI Explanations',
    desc: 'Get wrong? AI explains why the correct answer is right and helps you understand the concept. Real learning, not just memorization.',
  },
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
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
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
            Study smarter with
            <br />
            <span className="gradient-text">AI that gets it</span>
          </h1>

          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            Upload any document. Get instant flashcards. Study with real spaced repetition.
            AI-powered learning that actually works. No ads, no paywalls, ever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/create" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
              Start Studying Free
            </Link>
            <Link href="/search" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
              Search Study Materials
            </Link>
          </div>

          {/* Hero preview card */}
          <div className="relative max-w-2xl mx-auto">
            <div className="card p-0 overflow-hidden shadow-2xl shadow-brand-500/10">
              <div className="bg-dark-800 px-4 py-3 flex items-center gap-2 border-b border-dark-700">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-dark-500 text-sm">Biology 101 — Flashcard Mode</span>
              </div>
              <div className="p-8 sm:p-12">
                <div className="text-dark-500 text-sm mb-4 font-medium">QUESTION 4 of 25</div>
                <p className="text-2xl font-semibold text-white mb-8">
                  What is the powerhouse of the cell?
                </p>
                <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 text-brand-300">
                  Click to reveal answer
                </div>
              </div>
            </div>
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
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Upload Anything</h3>
            <p className="text-dark-400 text-sm">Drop a PDF, paste notes, or type Q&As manually. AI generates a complete study set in seconds.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Choose Your Mode</h3>
            <p className="text-dark-400 text-sm">Flashcards with spaced repetition, multiple choice tests with AI-generated options, or fill-in-the-blank.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
              3
            </div>
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
