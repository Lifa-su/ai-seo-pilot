/**
 * Core Web Vitals Analyzer (2025/2026 Standards)
 * LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
 * INP replaced FID as of March 2024
 * 2026: Engagement Reliability metric emerging
 */
function analyzeCoreWebVitals($, html, headers) {
  const results = { score: 0, maxScore: 0, checks: [] };

  // --- LCP Estimation (Largest Contentful Paint ≤ 2.5s) ---
  results.maxScore += 15;
  const lcpFactors = [];
  let lcpScore = 15;

  // Check for render-blocking resources
  const blockingCSS = $('link[rel="stylesheet"]').not('[media="print"]').not('[media="(prefers-color-scheme: dark)"]');
  const blockingJS = $('script[src]').not('[async]').not('[defer]').not('[type="module"]');
  if (blockingCSS.length > 3) { lcpScore -= 3; lcpFactors.push(`${blockingCSS.length} render-blocking CSS files`); }
  if (blockingJS.length > 2) { lcpScore -= 3; lcpFactors.push(`${blockingJS.length} render-blocking JS files (no async/defer)`); }

  // Check for preload hints
  const preloads = $('link[rel="preload"]');
  if (preloads.length === 0) { lcpScore -= 2; lcpFactors.push('No preload hints for critical resources'); }

  // Check hero image optimization
  const heroImg = $('img').first();
  if (heroImg.length) {
    const loading = heroImg.attr('loading');
    if (loading === 'lazy') { lcpScore -= 2; lcpFactors.push('First image uses lazy loading — above-fold images should load eagerly'); }
    const fetchpriority = heroImg.attr('fetchpriority');
    if (fetchpriority === 'high') { lcpScore += 0; } // already good
    else { lcpScore -= 1; lcpFactors.push('Consider fetchpriority="high" on hero/LCP image'); }
  }

  // Check for server timing / TTFB hints
  const serverTiming = headers['server-timing'] || '';
  const htmlSize = Buffer.byteLength(html, 'utf8');
  if (htmlSize > 200000) { lcpScore -= 2; lcpFactors.push(`Large HTML document (${(htmlSize / 1024).toFixed(0)}KB) — may slow TTFB`); }

  lcpScore = Math.max(0, lcpScore);
  results.score += lcpScore;
  results.checks.push({
    name: 'LCP (Largest Contentful Paint)',
    status: lcpScore >= 12 ? 'pass' : lcpScore >= 8 ? 'warn' : 'fail',
    score: lcpScore, max: 15,
    detail: lcpFactors.length === 0
      ? 'Good LCP indicators. Target: ≤ 2.5 seconds. No major blocking issues detected.'
      : `LCP risk factors: ${lcpFactors.join('; ')}. Target: ≤ 2.5 seconds.`
  });

  // --- INP Estimation (Interaction to Next Paint ≤ 200ms) ---
  results.maxScore += 15;
  let inpScore = 15;
  const inpFactors = [];

  // Count total JS files
  const allScripts = $('script[src]');
  if (allScripts.length > 10) { inpScore -= 3; inpFactors.push(`${allScripts.length} JavaScript files — heavy JS impacts INP`); }
  else if (allScripts.length > 5) { inpScore -= 1; inpFactors.push(`${allScripts.length} JavaScript files`); }

  // Check for inline scripts (potential long tasks)
  const inlineScripts = $('script').not('[src]').not('[type="application/ld+json"]').not('[type="application/json"]');
  let totalInlineSize = 0;
  inlineScripts.each((_, el) => { totalInlineSize += ($(el).html() || '').length; });
  if (totalInlineSize > 10000) { inpScore -= 3; inpFactors.push(`Large inline scripts (${(totalInlineSize / 1024).toFixed(1)}KB) — may cause long tasks`); }

  // Check for third-party scripts (analytics, ads, etc.)
  const thirdPartyPatterns = ['google-analytics', 'googletagmanager', 'facebook', 'hotjar', 'intercom', 'drift', 'hubspot', 'segment', 'mixpanel', 'amplitude'];
  let thirdPartyCount = 0;
  allScripts.each((_, el) => {
    const src = $(el).attr('src') || '';
    if (thirdPartyPatterns.some(p => src.includes(p))) thirdPartyCount++;
  });
  if (thirdPartyCount > 3) { inpScore -= 3; inpFactors.push(`${thirdPartyCount} third-party scripts detected — consider lazy loading`); }
  else if (thirdPartyCount > 1) { inpScore -= 1; inpFactors.push(`${thirdPartyCount} third-party scripts`); }

  // Check for web workers hint
  const hasWorker = html.includes('new Worker') || html.includes('SharedWorker');
  if (hasWorker) { inpFactors.push('Web Workers detected — good for offloading heavy computation'); }

  inpScore = Math.max(0, inpScore);
  results.score += inpScore;
  results.checks.push({
    name: 'INP (Interaction to Next Paint)',
    status: inpScore >= 12 ? 'pass' : inpScore >= 8 ? 'warn' : 'fail',
    score: inpScore, max: 15,
    detail: inpFactors.length === 0
      ? 'Good INP indicators. Target: ≤ 200ms. Replaced FID as Core Web Vital in March 2024.'
      : `INP risk factors: ${inpFactors.join('; ')}. Target: ≤ 200ms.`
  });

  // --- CLS Estimation (Cumulative Layout Shift ≤ 0.1) ---
  results.maxScore += 15;
  let clsScore = 15;
  const clsFactors = [];

  // Check images without dimensions
  let imgsWithoutDimensions = 0;
  $('img').each((_, el) => {
    const hasWidth = $(el).attr('width') || $(el).css('width');
    const hasHeight = $(el).attr('height') || $(el).css('height');
    if (!hasWidth || !hasHeight) imgsWithoutDimensions++;
  });
  if (imgsWithoutDimensions > 0) {
    clsScore -= Math.min(5, imgsWithoutDimensions);
    clsFactors.push(`${imgsWithoutDimensions} images without explicit width/height — causes layout shifts`);
  }

  // Check for iframes/embeds without dimensions
  const iframesNoDim = $('iframe').filter((_, el) => !$(el).attr('width') && !$(el).attr('height'));
  if (iframesNoDim.length > 0) { clsScore -= 2; clsFactors.push(`${iframesNoDim.length} iframes without dimensions`); }

  // Check for font-display
  const hasFontDisplay = html.includes('font-display:') || html.includes('font-display :');
  const hasGoogleFonts = html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com');
  if (hasGoogleFonts && !hasFontDisplay) { clsScore -= 2; clsFactors.push('Google Fonts loaded without font-display — may cause FOIT/FOUT'); }

  // Check for ads/dynamic content insertion patterns
  const hasAds = html.includes('googlesyndication') || html.includes('doubleclick') || html.includes('adsbygoogle');
  if (hasAds) { clsScore -= 2; clsFactors.push('Ad scripts detected — reserve space for ad slots to prevent CLS'); }

  clsScore = Math.max(0, clsScore);
  results.score += clsScore;
  results.checks.push({
    name: 'CLS (Cumulative Layout Shift)',
    status: clsScore >= 12 ? 'pass' : clsScore >= 8 ? 'warn' : 'fail',
    score: clsScore, max: 15,
    detail: clsFactors.length === 0
      ? 'Good CLS indicators. Target: ≤ 0.1. No major layout shift risks detected.'
      : `CLS risk factors: ${clsFactors.join('; ')}. Target: ≤ 0.1.`
  });

  // --- 2026 Engagement Reliability (Emerging Metric) ---
  results.maxScore += 5;
  let erScore = 5;
  const erFactors = [];

  // Check for service worker (offline capability)
  const hasServiceWorker = html.includes('serviceWorker') || html.includes('service-worker');
  if (!hasServiceWorker) { erScore -= 1; erFactors.push('No service worker detected — consider adding for offline reliability'); }

  // Check for error handling patterns
  const hasErrorBoundary = html.includes('onerror') || html.includes('addEventListener') && html.includes('error');
  if (!hasErrorBoundary) { erScore -= 1; erFactors.push('No visible error handling — add graceful degradation'); }

  // Check for progressive enhancement signals
  const hasNoscript = $('noscript').length > 0;
  if (!hasNoscript) { erScore -= 1; erFactors.push('No <noscript> fallback — add for progressive enhancement'); }

  erScore = Math.max(0, erScore);
  results.score += erScore;
  results.checks.push({
    name: '2026 Engagement Reliability',
    status: erScore >= 4 ? 'pass' : erScore >= 2 ? 'warn' : 'fail',
    score: erScore, max: 5,
    detail: erFactors.length === 0
      ? 'Good engagement reliability signals. This emerging 2026 metric measures consistent user experience.'
      : `Engagement reliability factors: ${erFactors.join('; ')}. Emerging 2026 metric.`
  });

  return results;
}

module.exports = { analyzeCoreWebVitals };
