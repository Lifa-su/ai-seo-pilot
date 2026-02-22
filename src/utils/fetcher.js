const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DEFAULT_TIMEOUT = 15000;
const USER_AGENT = 'Mozilla/5.0 (compatible; SEOPilot/1.0; +https://seopilot.dev)';
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

async function fetchPage(url, { mobile = false, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': mobile ? MOBILE_UA : USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await res.text();
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { html, status: res.status, headers, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

function parsePage(html) {
  const $ = cheerio.load(html);
  return $;
}

async function fetchRobotsTxt(baseUrl) {
  try {
    const url = new URL('/robots.txt', baseUrl).href;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
    });
    if (res.ok) return await res.text();
    return null;
  } catch { return null; }
}

async function fetchSitemap(baseUrl) {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml'];
  for (const path of candidates) {
    try {
      const url = new URL(path, baseUrl).href;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 8000,
      });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<urlset') || text.includes('<sitemapindex')) {
          return { url, content: text };
        }
      }
    } catch { continue; }
  }
  return null;
}

module.exports = { fetchPage, parsePage, fetchRobotsTxt, fetchSitemap, MOBILE_UA, USER_AGENT };
