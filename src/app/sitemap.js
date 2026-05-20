import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://quizfeast.onrender.com';

export default function sitemap() {
  const now = new Date().toISOString();
  const routes = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' },
    { url: '/answers', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/search', priority: 0.7, changeFrequency: 'monthly' },
    { url: '/create', priority: 0.5, changeFrequency: 'monthly' },
    { url: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  ];

  // Existing /cbt/[slug] static set
  const cbtDataDir = path.join(process.cwd(), 'public', 'data');
  if (fs.existsSync(cbtDataDir)) {
    for (const f of fs.readdirSync(cbtDataDir)) {
      if (!f.endsWith('.json')) continue;
      routes.push({
        url: `/cbt/${f.replace(/\.json$/, '')}`,
        priority: 0.8,
        changeFrequency: 'monthly',
      });
    }
  }

  // New /answers/[slug] long-tail set
  const answersDir = path.join(process.cwd(), 'public', 'data', 'answers');
  if (fs.existsSync(answersDir)) {
    for (const f of fs.readdirSync(answersDir)) {
      if (!f.endsWith('.json')) continue;
      routes.push({
        url: `/answers/${f.replace(/\.json$/, '')}`,
        priority: 0.7,
        changeFrequency: 'monthly',
      });
    }
  }

  return routes.map(r => ({
    url: `${BASE}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
