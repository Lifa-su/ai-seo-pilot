/**
 * Page Speed Analyzer
 * Provides actionable speed optimization suggestions based on HTML analysis
 */
function analyzePageSpeed($, html, headers) {
  const results = { score: 0, maxScore: 0, checks: [] };
  const htmlSize = Buffer.byteLength(html, 'utf8');

  // --- HTML Size ---
  results.maxScore += 8;
  if (htmlSize < 50000) {
    results.score += 8;
    results.checks.push({ name: 'HTML Size', status: 'pass', score: 8, max: 8,
      detail: `HTML document is ${(htmlSize / 1024).toFixed(1)}KB — well optimized.` });
  } else if (htmlSize < 150000) {
    results.score += 5;
    results.checks.push({ name: 'HTML Size', status: 'warn', score: 5, max: 8,
      detail: `HTML document is ${(htmlSize / 1024).toFixed(1)}KB — consider reducing inline styles/scripts.` });
  } else {
    results.score += 2;
    results.checks.push({ name: 'HTML Size', status: 'fail', score: 2, max: 8,
      detail: `HTML document is ${(htmlSize / 1024).toFixed(1)}KB — too large. Reduce inline content, move to external files.` });
  }

  // --- Image Optimization ---
  const images = $('img');
  let unoptimized = 0, modernFormat = 0, lazyLoaded = 0, missingAlt = 0;
  images.each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.match(/\.(webp|avif)(\?|$)/i)) modernFormat++;
    if ($(el).attr('loading') === 'lazy') lazyLoaded++;
    if (!$(el).attr('alt') && $(el).attr('alt') !== '') missingAlt++;
    if (src.match(/\.(bmp|tiff?)(\?|$)/i)) unoptimized++;
  });
  results.maxScore += 10;
  if (images.length === 0) {
    results.score += 10;
    results.checks.push({ name: 'Image Optimization', status: 'pass', score: 10, max: 10, detail: 'No images to optimize.' });
  } else {
    let imgScore = 5;
    const details = [`${images.length} images found`];
    if (modernFormat > 0) { imgScore += 2; details.push(`${modernFormat} use modern formats (WebP/AVIF)`); }
    else { details.push('Use WebP/AVIF for 25-50% smaller file sizes'); }
    if (lazyLoaded > 0) { imgScore += 2; details.push(`${lazyLoaded} use lazy loading`); }
    else { details.push('Add loading="lazy" to below-fold images'); }
    if (missingAlt > 0) { details.push(`${missingAlt} missing alt text`); }
    if (unoptimized > 0) { imgScore -= 2; details.push(`${unoptimized} use unoptimized formats (BMP/TIFF)`); }
    imgScore = Math.min(10, Math.max(0, imgScore));
    results.score += imgScore;
    results.checks.push({ name: 'Image Optimization', status: imgScore >= 7 ? 'pass' : 'warn',
      score: imgScore, max: 10, detail: details.join('. ') });
  }

  // --- CSS Optimization ---
  const cssFiles = $('link[rel="stylesheet"]');
  const inlineStyles = $('style');
  let inlineStyleSize = 0;
  inlineStyles.each((_, el) => { inlineStyleSize += ($(el).html() || '').length; });
  results.maxScore += 8;
  let cssScore = 8;
  const cssDetails = [];
  if (cssFiles.length > 5) { cssScore -= 3; cssDetails.push(`${cssFiles.length} external CSS files — combine and minify`); }
  else { cssDetails.push(`${cssFiles.length} external CSS files`); }
  if (inlineStyleSize > 20000) { cssScore -= 2; cssDetails.push(`${(inlineStyleSize / 1024).toFixed(1)}KB inline CSS — extract to external file`); }
  // Check for critical CSS pattern
  const hasCriticalCSS = html.includes('media="print"') || html.includes('rel="preload"');
  if (hasCriticalCSS) { cssDetails.push('✓ Critical CSS pattern detected'); }
  else { cssScore -= 1; cssDetails.push('Consider critical CSS / preload pattern'); }
  cssScore = Math.max(0, cssScore);
  results.score += cssScore;
  results.checks.push({ name: 'CSS Optimization', status: cssScore >= 6 ? 'pass' : 'warn',
    score: cssScore, max: 8, detail: cssDetails.join('. ') });

  // --- JavaScript Optimization ---
  const jsFiles = $('script[src]');
  const asyncScripts = $('script[async]').length;
  const deferScripts = $('script[defer]').length;
  const moduleScripts = $('script[type="module"]').length;
  results.maxScore += 10;
  let jsScore = 10;
  const jsDetails = [];
  if (jsFiles.length > 10) { jsScore -= 4; jsDetails.push(`${jsFiles.length} JS files — too many, bundle them`); }
  else if (jsFiles.length > 5) { jsScore -= 2; jsDetails.push(`${jsFiles.length} JS files`); }
  else { jsDetails.push(`${jsFiles.length} JS files`); }
  const optimizedJS = asyncScripts + deferScripts + moduleScripts;
  if (jsFiles.length > 0 && optimizedJS === 0) { jsScore -= 3; jsDetails.push('No async/defer/module scripts — add to prevent render blocking'); }
  else if (optimizedJS > 0) { jsDetails.push(`${optimizedJS} scripts use async/defer/module`); }
  jsScore = Math.max(0, jsScore);
  results.score += jsScore;
  results.checks.push({ name: 'JavaScript Optimization', status: jsScore >= 7 ? 'pass' : 'warn',
    score: jsScore, max: 10, detail: jsDetails.join('. ') });

  // --- Compression ---
  results.maxScore += 6;
  const encoding = headers['content-encoding'] || '';
  if (encoding.includes('br')) {
    results.score += 6;
    results.checks.push({ name: 'Compression', status: 'pass', score: 6, max: 6, detail: 'Brotli compression enabled — best compression ratio.' });
  } else if (encoding.includes('gzip')) {
    results.score += 5;
    results.checks.push({ name: 'Compression', status: 'pass', score: 5, max: 6, detail: 'Gzip compression enabled. Consider upgrading to Brotli for better compression.' });
  } else {
    results.checks.push({ name: 'Compression', status: 'fail', score: 0, max: 6, detail: 'No compression detected. Enable Gzip or Brotli to reduce transfer size by 60-80%.' });
  }

  // --- Caching ---
  results.maxScore += 6;
  const cacheControl = headers['cache-control'] || '';
  if (cacheControl.includes('max-age') || cacheControl.includes('s-maxage')) {
    results.score += 6;
    results.checks.push({ name: 'Caching', status: 'pass', score: 6, max: 6, detail: `Cache-Control header set: "${cacheControl}"` });
  } else if (cacheControl) {
    results.score += 3;
    results.checks.push({ name: 'Caching', status: 'warn', score: 3, max: 6, detail: `Cache-Control present but no max-age: "${cacheControl}"` });
  } else {
    results.checks.push({ name: 'Caching', status: 'fail', score: 0, max: 6, detail: 'No Cache-Control header. Set appropriate caching headers for static assets.' });
  }

  // --- Resource Hints ---
  results.maxScore += 7;
  let hintScore = 0;
  const hintDetails = [];
  if ($('link[rel="preconnect"]').length > 0) { hintScore += 2; hintDetails.push('✓ preconnect'); }
  if ($('link[rel="dns-prefetch"]').length > 0) { hintScore += 2; hintDetails.push('✓ dns-prefetch'); }
  if ($('link[rel="preload"]').length > 0) { hintScore += 2; hintDetails.push('✓ preload'); }
  if ($('link[rel="prefetch"]').length > 0) { hintScore += 1; hintDetails.push('✓ prefetch'); }
  hintScore = Math.min(7, hintScore);
  results.score += hintScore;
  results.checks.push({ name: 'Resource Hints', status: hintScore >= 4 ? 'pass' : hintScore >= 2 ? 'warn' : 'fail',
    score: hintScore, max: 7,
    detail: hintDetails.length > 0
      ? `Resource hints found: ${hintDetails.join(', ')}`
      : 'No resource hints. Add preconnect, dns-prefetch, and preload for critical resources.' });

  return results;
}

module.exports = { analyzePageSpeed };
