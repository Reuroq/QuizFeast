// LaunchChecklistAgent — pre-launch readiness checks that aren't about
// detecting bugs, but about making sure the site has the metadata and
// infrastructure expected for a public launch. Each missing piece is
// an issue.
//
// Covers: domain configuration, analytics presence, OG/social cards,
// robots.txt sanity, sitemap accessibility, favicon, manifest.json,
// 404 handling.

const SOCIAL_PAGES = ['/', '/answers', '/study'];

export async function runLaunchChecklistAgent({ baseUrl, store }) {
  // 1. Domain check — branded domain or default Render URL?
  if (baseUrl.includes('.onrender.com') || baseUrl.includes('vercel.app')) {
    store.report({
      agent: 'launch', category: 'no-branded-domain', severity: 'medium', url: baseUrl,
      message: `Site is on the default hosting domain (${new URL(baseUrl).host}). Branded domain recommended before public launch.`,
      suggested_fix: 'Register a domain + point at Render via custom-domain settings',
      auto_fixable: false,
    });
  }

  // 2. Analytics presence — fetch home and look for known analytics signatures
  let homeHtml;
  try {
    homeHtml = await (await fetch(`${baseUrl}/`)).text();
  } catch (err) {
    store.report({
      agent: 'launch', category: 'home-unreachable', severity: 'critical', url: `${baseUrl}/`,
      message: `Could not fetch home page: ${err.message}`,
      auto_fixable: false,
    });
    return;
  }
  const hasAnalytics =
    /googletagmanager\.com/.test(homeHtml) ||
    /google-analytics\.com/.test(homeHtml) ||
    /plausible\.io/.test(homeHtml) ||
    /umami\./.test(homeHtml) ||
    /posthog/.test(homeHtml);
  if (!hasAnalytics) {
    store.report({
      agent: 'launch', category: 'no-analytics', severity: 'medium', url: `${baseUrl}/`,
      message: 'No analytics provider detected in home-page HTML (GA, Plausible, Umami, PostHog, etc.)',
      suggested_fix: 'Wire Plausible or GA4 before launch so you can measure traffic + funnel',
      auto_fixable: false,
    });
  }

  // 3. OG / social cards — every shareable page should have og:title, og:description, og:image
  for (const path of SOCIAL_PAGES) {
    let html;
    try {
      html = await (await fetch(`${baseUrl}${path}`)).text();
    } catch { continue; }
    const og = {
      title: /<meta\s+property="og:title"\s+content="[^"]+"/i.test(html),
      desc: /<meta\s+property="og:description"\s+content="[^"]+"/i.test(html),
      image: /<meta\s+property="og:image"\s+content="[^"]+"/i.test(html),
      twitter: /<meta\s+name="twitter:card"\s+content="[^"]+"/i.test(html),
    };
    const missing = Object.entries(og).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      store.report({
        agent: 'launch', category: 'missing-social-meta', severity: 'medium',
        url: `${baseUrl}${path}`,
        sub_key: path,
        message: `${path} missing social meta tags: ${missing.join(', ')}. Link previews on social/messaging will look broken.`,
        suggested_fix: 'Add openGraph + twitter metadata to page metadata export',
        auto_fixable: false,
      });
    }
  }

  // 4. Favicon
  const hasFavicon = /<link[^>]+rel="(icon|shortcut icon)"/i.test(homeHtml);
  if (!hasFavicon) {
    store.report({
      agent: 'launch', category: 'missing-favicon', severity: 'low', url: `${baseUrl}/`,
      message: 'No favicon link in home-page HTML',
      suggested_fix: 'Add /app/icon.png or /public/favicon.ico',
      auto_fixable: false,
    });
  }

  // 5. robots.txt sanity
  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    if (!robotsRes.ok) {
      store.report({
        agent: 'launch', category: 'no-robots', severity: 'medium', url: `${baseUrl}/robots.txt`,
        message: `robots.txt returned ${robotsRes.status}. Search engines won't know which paths to crawl.`,
        auto_fixable: false,
      });
    } else {
      const robotsTxt = await robotsRes.text();
      if (!/Sitemap:/i.test(robotsTxt)) {
        store.report({
          agent: 'launch', category: 'robots-no-sitemap', severity: 'medium', url: `${baseUrl}/robots.txt`,
          message: 'robots.txt does not include a Sitemap: directive. Hampers crawl discovery.',
          auto_fixable: false,
        });
      }
    }
  } catch { /* fetch error already covered above */ }

  // 6. 404 page renders gracefully (not raw error)
  try {
    const notFoundRes = await fetch(`${baseUrl}/this-page-definitely-does-not-exist-${Date.now()}`);
    if (notFoundRes.status === 404) {
      const html = await notFoundRes.text();
      if (html.length < 200) {
        store.report({
          agent: 'launch', category: 'thin-404', severity: 'low', url: `${baseUrl}/`,
          message: `404 page is only ${html.length} bytes — likely the default Next 404 instead of a custom branded one.`,
          suggested_fix: 'Add src/app/not-found.jsx with helpful navigation back to /answers etc.',
          auto_fixable: false,
        });
      }
    } else if (notFoundRes.status === 200) {
      store.report({
        agent: 'launch', category: 'no-404-status', severity: 'high', url: `${baseUrl}/`,
        message: `Bad URL returns 200 instead of 404 — broken for SEO + monitoring`,
        auto_fixable: false,
      });
    }
  } catch { /* network error not a content issue */ }
}
