import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnswerSearch from '@/components/AnswerSearch';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'topics');

function loadTopic(slug) {
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
  const data = loadTopic(slug);
  if (!data) return { title: 'Not found' };
  const description = `${data.question_count} verified questions and answers about ${data.name}, aggregated from ${data.source_cbt_count} military CBTs. Free study guide, no login.`;
  return {
    title: `${data.name} — Answers & Study Guide | QuizFeast`,
    description,
    openGraph: {
      title: `${data.name} — All Questions & Answers`,
      description,
      type: 'article',
    },
    alternates: { canonical: `/answers/topic/${slug}` },
  };
}

function FAQJsonLd({ data }) {
  if (!data.qas?.length) return null;
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.qas.slice(0, 50).map(qa => ({
      '@type': 'Question',
      name: qa.q.slice(0, 220),
      acceptedAnswer: { '@type': 'Answer', text: qa.a.slice(0, 800) },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />;
}

export default async function TopicPage({ params }) {
  const { slug } = await params;
  const data = loadTopic(slug);
  if (!data) notFound();

  // Reshape topic qas into AnswerSearch's expected shape (no sections inside)
  const qas = data.qas.map(qa => ({ q: qa.q, a: qa.a }));

  // Unique source CBTs for the footer "appears in" panel
  const sourceCbts = [];
  const seen = new Set();
  for (const qa of data.qas) {
    if (!seen.has(qa.source_slug)) {
      seen.add(qa.source_slug);
      sourceCbts.push({ slug: qa.source_slug, title: qa.source_title });
    }
  }

  return (
    <div className="relative">
      <FAQJsonLd data={data} />

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-6">
          <Link href="/answers" className="text-brand-400 text-sm hover:text-brand-300">
            &larr; All answer keys
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            Topic Deep Dive
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-dark-800 border border-dark-700 text-dark-300 text-xs font-medium">
            Across {data.source_cbt_count} CBTs
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
          {data.name}
        </h1>

        <p className="text-dark-400 mb-8">
          {data.question_count} verified questions and answers about {data.name}, aggregated from every CBT we&apos;ve indexed that covers this topic.
        </p>

        <AnswerSearch qas={qas} sections={null} />

        <div className="mt-12 card p-6">
          <h2 className="text-base font-bold text-white mb-3">CBTs that cover {data.name}</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {sourceCbts.map(c => (
              <Link key={c.slug} href={`/answers/${c.slug}`} className="text-sm text-brand-400 hover:text-brand-300">
                {c.title} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
