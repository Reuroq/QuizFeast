import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'answers');

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

function loadPage(slug) {
  const p = path.join(DATA_DIR, slug + '.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export async function generateStaticParams() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ slug: f.replace(/\.json$/, '') }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = loadPage(slug);
  if (!data) return { title: 'Not found' };

  const bucket = BUCKET_LABELS[data.bucket] || 'Study';
  const qCount = data.question_count || 0;
  const descPrefix = qCount > 0
    ? `${qCount} verified questions and answers for ${data.title}.`
    : `${data.title} — study notes and overview.`;
  const description = `${descPrefix} Free military CBT and certification answer key. No login required.`;

  return {
    title: `${data.title} — Answers & Study Guide | QuizFeast`,
    description,
    openGraph: {
      title: `${data.title} — Answers`,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `/answers/${slug}`,
    },
  };
}

function FAQJsonLd({ data }) {
  if (data.kind !== 'qa' || !data.qas?.length) return null;
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.qas.slice(0, 50).map(qa => ({
      '@type': 'Question',
      name: qa.q.slice(0, 220),
      acceptedAnswer: { '@type': 'Answer', text: qa.a.slice(0, 800) },
    })),
  };
  return (
    <script
      type="application/ld+json"
      // Server-rendered — safe to dangerouslySet here
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
    />
  );
}

export default async function AnswerPage({ params }) {
  const { slug } = await params;
  const data = loadPage(slug);
  if (!data) notFound();

  const bucketLabel = BUCKET_LABELS[data.bucket] || 'Study';

  return (
    <div className="relative">
      <FAQJsonLd data={data} />

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-6">
          <Link href="/answers" className="text-brand-400 text-sm hover:text-brand-300">
            &larr; All answer keys
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-4">
          {bucketLabel}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
          {data.title}
        </h1>

        {data.kind === 'qa' && (
          <p className="text-dark-400 mb-8">
            {data.question_count} verified questions and answers. Free — no login.
          </p>
        )}

        {data.kind === 'qa' && (
          <div className="space-y-4">
            {data.qas.map((qa, i) => (
              <div key={i} className="card p-5">
                <div className="text-dark-500 text-xs font-semibold mb-2">QUESTION {i + 1}</div>
                <p className="text-white font-medium mb-4 whitespace-pre-wrap">{qa.q}</p>
                <div className="border-l-2 border-brand-500/40 pl-4">
                  <div className="text-brand-300 text-xs font-semibold mb-1">ANSWER</div>
                  <p className="text-dark-200 whitespace-pre-wrap">{qa.a}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.kind === 'prose' && data.prose && (
          <div className="card p-6">
            <div className="prose prose-invert max-w-none">
              {data.prose.body.split(/\n\n+/).map((p, i) => (
                <p key={i} className="text-dark-200 mb-4 whitespace-pre-wrap">{p}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 card p-6 bg-gradient-to-br from-brand-900/30 to-dark-900 border-brand-700/30">
          <h2 className="text-xl font-bold text-white mb-2">Looking for a different version?</h2>
          <p className="text-dark-400 mb-4 text-sm">
            CBTs get updated every year. Search for the exact version you&apos;re taking
            (e.g. &quot;cyber awareness 2025&quot;).
          </p>
          <Link href="/search" className="btn-primary inline-block text-sm">
            Search all study materials
          </Link>
        </div>
      </article>
    </div>
  );
}
