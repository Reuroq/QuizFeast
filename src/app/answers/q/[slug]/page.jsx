import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnswerDisclaimer from '@/components/AnswerDisclaimer';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'canonical');

const BUCKET_LABELS = {
  cbt_annual: 'DoD Annual Training',
  cbt_security: 'Security & Intelligence',
  cbt_jko: 'Joint Training',
  cbt_health: 'Health & Safety',
  cbt_ammo: 'Ammunition',
  cbt_army: 'Army',
  cbt_af: 'Air Force',
  cbt_navy: 'Navy',
  cbt_marine: 'Marine Corps',
  cbt_prof: 'Professional Development',
  cert_it: 'IT Certifications',
};

function loadQ(slug) {
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
  const data = loadQ(slug);
  if (!data) return { title: 'Not found' };
  const qTrim = data.question.length > 80 ? data.question.slice(0, 77) + '…' : data.question;
  const description = `Answer to: "${qTrim}" — verified across ${data.appears_in_count} CBTs including Cyber Awareness, OPSEC, and more.`;
  return {
    title: `${qTrim} — Answer | QuizFeast`,
    description,
    openGraph: {
      title: qTrim,
      description,
      type: 'article',
    },
    alternates: { canonical: `/answers/q/${slug}` },
  };
}

function QAJsonLd({ data }) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: data.question.slice(0, 220),
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: data.canonical_answer.slice(0, 1500),
      },
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export default async function CanonicalQPage({ params }) {
  const { slug } = await params;
  const data = loadQ(slug);
  if (!data) notFound();

  // Are there variant answers? Show alternates if a different CBT has a meaningfully different answer.
  const seenAnswers = new Set();
  const variants = [];
  for (const c of data.appears_in) {
    const trimmed = c.answer.trim();
    if (!seenAnswers.has(trimmed) && trimmed !== data.canonical_answer.trim()) {
      seenAnswers.add(trimmed);
      variants.push({ ...c });
    }
  }

  return (
    <div className="relative">
      <QAJsonLd data={data} />

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-6">
          <Link href="/answers" className="text-brand-400 text-sm hover:text-brand-300 inline-block py-2">
            &larr; All answer keys
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            Community Question
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-dark-800 border border-dark-700 text-dark-300 text-xs font-medium">
            Seen on {data.appears_in_count} CBTs
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-snug">
          {data.question}
        </h1>

        <AnswerDisclaimer />

        <div className="card p-6 border-brand-500/30">
          <div className="text-brand-300 text-xs font-semibold mb-2 uppercase tracking-wider">Answer</div>
          <p className="text-white text-lg whitespace-pre-wrap leading-relaxed">{data.canonical_answer}</p>
        </div>

        {variants.length > 0 && (
          <div className="mt-8 card p-6">
            <h2 className="text-base font-bold text-white mb-3">
              Alternate answers seen on other CBTs
            </h2>
            <p className="text-dark-500 text-xs mb-4">
              The same question shows up worded slightly differently across CBT versions.
              Here are the other answer variants we&apos;ve indexed.
            </p>
            <div className="space-y-3">
              {variants.slice(0, 5).map((v, i) => (
                <div key={i} className="border-l-2 border-dark-700 pl-3">
                  <p className="text-dark-200 text-sm whitespace-pre-wrap mb-1.5">{v.answer}</p>
                  <Link href={`/answers/${v.slug}`} className="text-xs text-brand-400 hover:text-brand-300">
                    {v.title} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 card p-6">
          <h2 className="text-base font-bold text-white mb-3">
            This question appears on
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
            {data.appears_in.map(c => (
              <Link key={c.slug} href={`/answers/${c.slug}`} className="text-sm text-brand-400 hover:text-brand-300 line-clamp-1">
                {c.title} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
