const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://quizfeast.com';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' , disallow: ['/api/', '/admin/'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
