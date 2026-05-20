import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://quizfeast.onrender.com';

export default function sitemap() {
  const now = new Date().toISOString();
  const routes = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' },
    { url: '/answers', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/study', priority: 0.85, changeFrequency: 'monthly' },
    { url: '/search', priority: 0.7, changeFrequency: 'monthly' },
    { url: '/create', priority: 0.5, changeFrequency: 'monthly' },
    { url: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { url: '/dmca', priority: 0.3, changeFrequency: 'yearly' },
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

  // /answers/[slug] long-tail set
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

  // /answers/topic/[slug] topic deep-dive pages
  const topicsDir = path.join(process.cwd(), 'public', 'data', 'topics');
  if (fs.existsSync(topicsDir)) {
    for (const f of fs.readdirSync(topicsDir)) {
      if (!f.endsWith('.json')) continue;
      routes.push({
        url: `/answers/topic/${f.replace(/\.json$/, '')}`,
        priority: 0.75,
        changeFrequency: 'monthly',
      });
    }
  }

  // /answers/q/[slug] canonical question pages
  const canonicalDir = path.join(process.cwd(), 'public', 'data', 'canonical');
  if (fs.existsSync(canonicalDir)) {
    for (const f of fs.readdirSync(canonicalDir)) {
      if (!f.endsWith('.json')) continue;
      routes.push({
        url: `/answers/q/${f.replace(/\.json$/, '')}`,
        priority: 0.65,
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
