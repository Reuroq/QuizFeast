import fs from 'node:fs';
import path from 'node:path';
import AnswersIndex from '@/components/AnswersIndex';

const INDEX_FILE = path.join(process.cwd(), 'scripts', 'ihatecbts_pass2_index.json');

export const metadata = {
  title: 'CBT Answer Keys — All Courses | QuizFeast',
  description: 'Free community-sourced answer keys for every major CBT, JKO course, and DoD training requirement. Cyber Awareness, OPSEC, SERE, SAPR, and 1,300+ more.',
  alternates: { canonical: '/answers' },
};

function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

export default function AnswersIndexPage() {
  const { entries } = loadIndex();
  return <AnswersIndex entries={entries} />;
}
