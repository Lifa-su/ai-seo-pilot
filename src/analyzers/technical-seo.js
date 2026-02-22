/**
 * Technical SEO Analyzer
 * Checks: robots.txt, sitemap, canonical, structured data, HTTPS, meta robots, hreflang, etc.
 */
const { fetchRobotsTxt, fetchSitemap } = require('../utils/fetcher');

async function analyzeTechnicalSEO($, url, headers) {
  const results = { score: 0, maxScore: 0, checks: [] };
  let baseUrl;
  try { baseUrl = new URL(url).origin; } catch { baseUrl = url; }

  // --- HTTPS ---
  results.maxScore += 10;
  const isHttps = url.startsWith('https://');
  if (isHttps) {
    results.score += 10;
    results.checks.push({ name: 'HTTPS', status: 'pass', score: 10, max: 10, detail: 'Site uses HTTPS. Secure connection confirmed.' });
  } else {
    results.checks.push({ name: 'HTTPS', status: 'fail', score: 0, max: 10, detail: 'Site does not use HTTPS. Migrate to HTTPS immediately — it is a confirmed ranking signal.' });
  }

  // --- Canonical Tag ---
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  results.maxScore += 8;
  if (canonical) {
    results.score += 8;
    results.checks.push({ name: 'Canonical Tag', status: 'pass', score: 8, max: 8, detail: `Canonical URL set: ${canonical}` });
  } else {
    results.checks.push({ name: 'Canonical Tag', status: 'fail', score: 0, max: 8, detail: 'No canonical tag found. Add <link rel="canonical"> to prevent duplicate content issues.' });
  }

  // --- Meta Robots ---
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  results.maxScore += 6;
  if (metaRobots.includes('noindex')) {
    results.checks.push({ name: 'Meta Robots', status: 'fail', score: 0, max: 6, detail: `Page is set to noindex: "${metaRobots}". This page will NOT appear in search results.` });
  } else if (metaRobots) {
    results.score += 6;
    results.checks.push({ name: 'Meta Robots', status: 'pass', score: 6, max: 6, detail: `Meta robots: "${metaRobots}"` });
  } else {
    results.score += 6;
    results.checks.push({ name: 'Meta Robots', status: 'pass', score: 6, max: 6, detail: 'No restrictive meta robots tag. Page is indexable by default.' });
  }

  // --- Language / Hreflang ---
  const htmlLang = $('html').attr('lang') || '';
  const hreflangs = $('link[rel="alternate"][hreflang]');
  results.maxScore += 5;
  if (htmlLang) {
    results.score += 3;
    let detail = `HTML lang attribute set: "${htmlLang}".`;
    if (hreflangs.length > 0) {
      results.score += 2;
      const langs = [];
      hreflangs.each((_, el) => langs.push($(el).attr('hreflang')));
      detail += ` Hreflang tags found: ${langs.join(', ')}`;
    } else {
      detail += ' No hreflang tags found. Add them if you have multilingual content.';
    }
    results.checks.push({ name: 'Language Tags', status: hreflangs.length > 0 ? 'pass' : 'warn', score: results.score >= 5 ? 5 : 3, max: 5, detail });
  } else {
    results.checks.push({ name: 'Language Tags', status: 'warn', score: 0, max: 5, detail: 'No lang attribute on <html>. Add lang="en" (or appropriate language) for accessibility and SEO.' });
  }

  // --- Structured Data (JSON-LD) ---
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const schemas = [];
  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type']) schemas.push(data['@type']);
      else if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach(item => { if (item['@type']) schemas.push(item['@type']); });
      }
    } catch {}
  });
  results.maxScore += 10;
  if (schemas.length > 0) {
    results.score += 10;
    results.checks.push({ name: 'Structured Data', status: 'pass', score: 10, max: 10, detail: `JSON-LD structured data found. Schema types: ${schemas.join(', ')}` });
  } else {
    // Check for microdata
    const microdata = $('[itemtype]');
    if (microdata.length > 0) {
      results.score += 6;
      const types = [];
      microdata.each((_, el) => types.push($(el).attr('itemtype')));
      results.checks.push({ name: 'Structured Data', status: 'warn', score: 6, max: 10, detail: `Microdata found but JSON-LD is recommended. Types: ${types.slice(0, 5).join(', ')}` });
    } else {
      results.checks.push({ name: 'Structured Data', status: 'fail', score: 0, max: 10, detail: 'No structured data found. Add JSON-LD schema markup (Article, Organization, FAQ, etc.) to enhance search appearance.' });
    }
  }

  // --- Robots.txt ---
  results.maxScore += 6;
  const robotsTxt = await fetchRobotsTxt(baseUrl);
  if (robotsTxt) {
    const hasSitemap = robotsTxt.toLowerCase().includes('sitemap:');
    results.score += hasSitemap ? 6 : 4;
    results.checks.push({
      name: 'Robots.txt',
      status: hasSitemap ? 'pass' : 'warn',
      score: hasSitemap ? 6 : 4, max: 6,
      detail: hasSitemap
        ? 'robots.txt found with sitemap reference.'
        : 'robots.txt found but no sitemap reference. Add Sitemap: directive.'
    });
  } else {
    results.checks.push({ name: 'Robots.txt', status: 'fail', score: 0, max: 6, detail: 'No robots.txt found. Create one to guide search engine crawlers.' });
  }

  // --- Sitemap ---
  results.maxScore += 6;
  const sitemap = await fetchSitemap(baseUrl);
  if (sitemap) {
    results.score += 6;
    const urlCount = (sitemap.content.match(/<loc>/g) || []).length;
    results.checks.push({ name: 'XML Sitemap', status: 'pass', score: 6, max: 6, detail: `Sitemap found at ${sitemap.url} (${urlCount} URLs).` });
  } else {
    results.checks.push({ name: 'XML Sitemap', status: 'fail', score: 0, max: 6, detail: 'No XML sitemap found. Create and submit a sitemap to Google Search Console.' });
  }

  // --- Viewport Meta ---
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  results.maxScore += 5;
  if (viewport) {
    results.score += 5;
    results.checks.push({ name: 'Viewport Meta', status: 'pass', score: 5, max: 5, detail: `Viewport meta tag set: "${viewport}"` });
  } else {
    results.checks.push({ name: 'Viewport Meta', status: 'fail', score: 0, max: 5, detail: 'No viewport meta tag. Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile compatibility.' });
  }

  // --- Charset ---
  const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '';
  results.maxScore += 4;
  if (charset) {
    results.score += 4;
    results.checks.push({ name: 'Character Encoding', status: 'pass', score: 4, max: 4, detail: `Character encoding declared: ${charset}` });
  } else {
    results.checks.push({ name: 'Character Encoding', status: 'warn', score: 0, max: 4, detail: 'No explicit charset declaration. Add <meta charset="UTF-8">.' });
  }

  // --- X-Robots-Tag Header ---
  results.maxScore += 4;
  const xRobots = headers['x-robots-tag'] || '';
  if (xRobots && xRobots.includes('noindex')) {
    results.checks.push({ name: 'X-Robots-Tag Header', status: 'fail', score: 0, max: 4, detail: `X-Robots-Tag header contains noindex: "${xRobots}". Page will not be indexed.` });
  } else {
    results.score += 4;
    results.checks.push({ name: 'X-Robots-Tag Header', status: 'pass', score: 4, max: 4, detail: xRobots ? `X-Robots-Tag: "${xRobots}"` : 'No restrictive X-Robots-Tag header.' });
  }

  return results;
}

module.exports = { analyzeTechnicalSEO };
