import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';

const INDEX_FILE = path.join(process.cwd(), 'scripts', 'ihatecbts_pass2_index.json');

const BUCKET_LABELS = {
  cbt_annual: 'DoD Annual Training',
  cbt_security: 'Security & Intelligence',
  cbt_jko: 'JKO / Joint',
  cbt_health: 'Health & Safety',
  cbt_ammo: 'Ammunition',
  cbt_army: 'Army',
  cbt_af: 'Air Force',
  cbt_navy: 'Navy',
  cbt_marine: 'Marine Corps',
  cbt_prof: 'Professional Development',
  cert_it: 'IT Certifications',
};

const BUCKET_ORDER = [
  'cbt_annual', 'cbt_security', 'cbt_jko', 'cbt_health',
  'cbt_army', 'cbt_af', 'cbt_navy', 'cbt_marine',
  'cbt_ammo', 'cbt_prof', 'cert_it',
];

export const metadata = {
  title: 'Military CBT Answer Keys — All Courses | QuizFeast',
  description: 'Free verified answer keys for every major military CBT, JKO course, and DoD training requirement. Cyber Awareness, OPSEC, SERE, SAPR, and 1,300+ more.',
  alternates: { canonical: '/answers' },
};

function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

export default function AnswersIndex() {
  const { entries } = loadIndex();

  const byBucket = {};
  for (const e of entries) {
    (byBucket[e.bucket] ||= []).push(e);
  }
  for (const arr of Object.values(byBucket)) {
    arr.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
  }

  const totalQuestions = entries.reduce((s, e) => s + (e.question_count || 0), 0);

  return (
    <div className="relative">
      <section className="max-w-6xl mx-auto px-4 pt-28 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {entries.length.toLocaleString()} answer keys &middot; {totalQuestions.toLocaleString()}+ questions
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          Military CBT{' '}
          <span className="gradient-text">Answer Keys</span>
        </h1>

        <p className="text-lg text-dark-400 max-w-2xl mx-auto mb-8">
          Every version of every CBT &mdash; cyber awareness, OPSEC, SERE, SAPR, AFIs, MOS guides,
          IT certs. Free, ad-free, no login.
        </p>

        <Link href="/search" className="btn-secondary inline-block">
          Search all study materials &rarr;
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        {BUCKET_ORDER.filter(b => byBucket[b]?.length).map(bucket => {
          const list = byBucket[bucket];
          return (
            <div key={bucket} id={bucket} className="mt-12">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-white">
                  {BUCKET_LABELS[bucket] || bucket}
                </h2>
                <span className="text-dark-500 text-sm">{list.length} answer keys</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map(e => (
                  <Link
                    key={e.slug}
                    href={`/answers/${e.slug}`}
                    className="card-hover p-4 group"
                  >
                    <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
                      {e.title}
                    </h3>
                    <div className="text-dark-500 text-xs">
                      {e.kind === 'qa'
                        ? `${e.question_count} questions`
                        : 'Study notes'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
