// Sitemap crawler. Reads sitemap.xml from the configured base URL, returns
// a categorized list of all SSG + dynamic URLs the site exposes.

import { XMLParser } from 'fast-xml-parser';

function categorize(url) {
  if (url === '/' || url.endsWith('/')) return 'root';
  if (url.match(/^\/answers$/)) return 'answers-index';
  if (url.match(/^\/answers\/topic\//)) return 'answers-topic';
  if (url.match(/^\/answers\/q\//)) return 'answers-canonical';
  if (url.match(/^\/answers\//)) return 'answers-slug';
  if (url.match(/^\/cbt\//)) return 'cbt-slug';
  if (url.match(/^\/(terms|dmca|privacy|disclaimer)$/)) return 'legal';
  if (url === '/study' || url === '/create' || url === '/search') return 'feature';
  return 'other';
}

export async function crawlSitemap(baseUrl) {
  const res = await fetch(`${baseUrl}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const urlEntries = parsed.urlset?.url || [];
  const arr = Array.isArray(urlEntries) ? urlEntries : [urlEntries];
  const out = [];
  for (const entry of arr) {
    const fullUrl = entry.loc;
    if (!fullUrl) continue;
    const pathname = new URL(fullUrl).pathname;
    out.push({
      url: fullUrl,
      pathname,
      category: categorize(pathname),
      priority: entry.priority ? parseFloat(entry.priority) : 0.5,
      changefreq: entry.changefreq || 'monthly',
    });
  }
  return out;
}

// Group URLs by category for easier sampling in agent runs
export function groupByCategory(urls) {
  const groups = {};
  for (const u of urls) {
    if (!groups[u.category]) groups[u.category] = [];
    groups[u.category].push(u);
  }
  return groups;
}

// Deterministic sample of N items from an array. Uses every-Nth-step pattern
// so the sample covers the full range (vs. random which may cluster).
export function evenSample(arr, n) {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}
