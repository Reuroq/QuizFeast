import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CBTContent from '@/components/CBTContent';

// CBT metadata — title + gradient color per slug.
// (Subset of the master list; only slugs we expect to render. Unknown slugs
// fall back to data.title and a neutral gradient.)
const CBT_META = {
  cyber_awareness: { title: 'Cyber Awareness Challenge', color: 'from-blue-500 to-cyan-500' },
  insider_threat: { title: 'Insider Threat Awareness', color: 'from-red-500 to-orange-500' },
  opsec: { title: 'OPSEC Awareness', color: 'from-emerald-500 to-green-500' },
  antiterrorism: { title: 'Antiterrorism Level 1', color: 'from-yellow-500 to-amber-500' },
  hipaa_privacy: { title: 'HIPAA & Privacy Act', color: 'from-purple-500 to-violet-500' },
  law_of_war: { title: 'Law of War', color: 'from-slate-400 to-zinc-500' },
  sere: { title: 'SERE 100.2', color: 'from-lime-500 to-emerald-600' },
  cbrn: { title: 'CBRN Awareness', color: 'from-orange-500 to-red-600' },
  ctip: { title: 'Combating Trafficking in Persons', color: 'from-pink-400 to-rose-600' },
  tarp: { title: 'TARP — Threat Awareness & Reporting', color: 'from-indigo-500 to-blue-600' },
  force_protection: { title: 'Force Protection', color: 'from-teal-500 to-cyan-600' },
  sapr: { title: 'Sexual Assault Prevention & Response', color: 'from-pink-500 to-rose-500' },
  suicide_prevention: { title: 'Suicide Prevention', color: 'from-violet-500 to-purple-500' },
  equal_opportunity: { title: 'Equal Opportunity', color: 'from-sky-500 to-blue-500' },
  cui: { title: 'Controlled Unclassified Information', color: 'from-blue-400 to-indigo-500' },
  ethics: { title: 'DoD Ethics', color: 'from-amber-500 to-yellow-600' },
  risk_management: { title: 'Composite Risk Management', color: 'from-amber-400 to-orange-500' },
  sejpme: { title: 'SEJPME I', color: 'from-emerald-500 to-teal-500' },
  information_security: { title: 'Information Security', color: 'from-slate-400 to-zinc-500' },
  records_management: { title: 'Records Management', color: 'from-stone-400 to-zinc-500' },
  dod_cyber_fundamentals: { title: 'Cyber Fundamentals', color: 'from-cyan-500 to-blue-600' },
  driving_for_life: { title: 'Driving for Life', color: 'from-green-500 to-emerald-500' },
  hazmat: { title: 'HAZMAT / HAZCOM', color: 'from-yellow-500 to-orange-500' },
  sharp: { title: 'Army SHARP', color: 'from-yellow-500 to-green-600' },
  army_values: { title: 'Army Values & Leadership', color: 'from-green-600 to-emerald-700' },
  air_force_pme: { title: 'Air Force PME / PDG', color: 'from-blue-600 to-sky-500' },
  navy_bmt: { title: 'Navy GMT / BMR', color: 'from-blue-800 to-indigo-600' },
  ucmj: { title: 'UCMJ Basics', color: 'from-gray-500 to-slate-600' },
  pii_training: { title: 'PII Training', color: 'from-purple-400 to-violet-500' },
  dod_annual_security: { title: 'Annual Security Awareness', color: 'from-gray-400 to-slate-500' },
  wmd: { title: 'Combating WMD', color: 'from-red-500 to-rose-600' },
  trafficking_awareness: { title: 'Human Trafficking Awareness', color: 'from-pink-500 to-fuchsia-500' },
  domestic_violence: { title: 'Domestic Violence / FAP', color: 'from-rose-400 to-pink-500' },
  financial_readiness: { title: 'Financial Readiness', color: 'from-green-400 to-emerald-500' },
  first_aid: { title: 'TCCC / Military First Aid', color: 'from-red-400 to-rose-500' },
  no_fear_act: { title: 'No FEAR Act', color: 'from-indigo-400 to-violet-500' },
  counterintelligence: { title: 'Counterintelligence Awareness', color: 'from-red-400 to-orange-500' },
  derivative_classification: { title: 'Derivative Classification', color: 'from-slate-500 to-gray-600' },
  active_shooter: { title: 'Active Shooter Training', color: 'from-red-600 to-rose-700' },
  workplace_violence: { title: 'Workplace Violence Prevention', color: 'from-orange-400 to-red-500' },
  ejpme: { title: 'EJPME / SEJPME II', color: 'from-teal-500 to-emerald-600' },
  intelligence_oversight: { title: 'Intelligence Oversight', color: 'from-purple-500 to-indigo-500' },
  substance_abuse: { title: 'Substance Abuse Prevention', color: 'from-teal-400 to-emerald-500' },
  concussion_tbi: { title: 'Concussion / TBI', color: 'from-blue-400 to-cyan-400' },
  marking_classified: { title: 'Marking Classified Information', color: 'from-zinc-400 to-slate-500' },
  ammo_45: { title: 'AMMO-45 Intro to Ammunition', color: 'from-orange-600 to-red-600' },
  ammo_67: { title: 'AMMO-67 HAZMAT Transport', color: 'from-orange-500 to-amber-600' },
  bloodborne_pathogens: { title: 'Bloodborne Pathogens', color: 'from-red-500 to-pink-500' },
  accident_avoidance: { title: 'Accident Avoidance Course', color: 'from-yellow-400 to-amber-500' },
  tap: { title: 'TAP / Transition Assistance', color: 'from-blue-400 to-indigo-400' },
  acquisition_ethics: { title: 'Acquisition Ethics (CLM 003)', color: 'from-amber-400 to-yellow-500' },
  marine_leadership: { title: 'Marine Corps Leadership', color: 'from-red-700 to-rose-800' },
  environmental_awareness: { title: 'Environmental / RCRA', color: 'from-green-400 to-lime-500' },
};

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function loadCBT(slug) {
  const file = path.join(DATA_DIR, slug + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}

export async function generateStaticParams() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ slug: f.replace(/\.json$/, '') }));
}

// SSG: render the page server-side at build time. Eliminates CLS (Cumulative
// Layout Shift) — the previous client-component implementation fetched data
// on mount, so 50+ Q cards dropped in after first paint. Audit measured
// CLS 0.37 (Google CWV "good" is <0.1). Server-side rendering puts the
// full page in the initial HTML so no layout shift occurs.

export default async function CBTPage({ params }) {
  const { slug } = await params;
  const meta = CBT_META[slug] || { title: slug.replace(/_/g, ' '), color: 'from-dark-500 to-dark-400' };
  const data = loadCBT(slug);
  if (!data) notFound();

  return (
    <div className="relative min-h-screen">
      {/* Header — server-rendered, no layout shift */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br ${meta.color} opacity-5 rounded-full blur-3xl`} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-12">
          <Link href="/#cbt-library" className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 text-sm mb-6 transition-colors py-2">
            &larr; Back to CBT Library
          </Link>
          <div className={`h-1.5 w-24 bg-gradient-to-r ${meta.color} rounded-full mb-6`} />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            {meta.title}
          </h1>
          <p className="text-lg text-dark-400 mb-2">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-dark-400">
              {data.questions.length} questions and answers — updated 2025/2026
            </span>
          </div>
        </div>
      </div>

      {/* Client-component for interactive search, expand/collapse, modals */}
      <CBTContent data={data} slug={slug} meta={meta} />
    </div>
  );
}
