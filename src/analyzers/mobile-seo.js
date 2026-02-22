/**
 * Mobile SEO Analyzer
 * Checks viewport, responsive design, touch targets, mobile-friendliness
 */
function analyzeMobileSEO($, html, headers) {
  const results = { score: 0, maxScore: 0, checks: [] };

  // --- Viewport ---
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  results.maxScore += 12;
  if (!viewport) {
    results.checks.push({ name: 'Viewport Configuration', status: 'fail', score: 0, max: 12,
      detail: 'No viewport meta tag. Add <meta name="viewport" content="width=device-width, initial-scale=1">.' });
  } else {
    let vpScore = 6;
    const vpDetails = [`Viewport: "${viewport}"`];
    if (viewport.includes('width=device-width')) { vpScore += 3; vpDetails.push('✓ width=device-width'); }
    else { vpDetails.push('✗ Missing width=device-width'); }
    if (viewport.includes('initial-scale=1')) { vpScore += 2; vpDetails.push('✓ initial-scale=1'); }
    if (viewport.includes('maximum-scale=1') || viewport.includes('user-scalable=no')) {
      vpScore -= 2; vpDetails.push('⚠ Zoom disabled — bad for accessibility');
    }
    vpScore = Math.min(12, Math.max(0, vpScore));
    results.score += vpScore;
    results.checks.push({ name: 'Viewport Configuration', status: vpScore >= 10 ? 'pass' : 'warn',
      score: vpScore, max: 12, detail: vpDetails.join('. ') });
  }

  // --- Responsive Images ---
  let responsiveImgs = 0, totalImgs = 0;
  $('img').each((_, el) => {
    totalImgs++;
    const srcset = $(el).attr('srcset');
    const sizes = $(el).attr('sizes');
    const parent = $(el).parent();
    if (srcset || sizes || parent.is('picture')) responsiveImgs++;
  });
  results.maxScore += 10;
  if (totalImgs === 0) {
    results.score += 10;
    results.checks.push({ name: 'Responsive Images', status: 'pass', score: 10, max: 10, detail: 'No images found to evaluate.' });
  } else {
    const ratio = responsiveImgs / totalImgs;
    const imgScore = Math.round(ratio * 10);
    results.score += imgScore;
    results.checks.push({ name: 'Responsive Images', status: ratio >= 0.5 ? 'pass' : ratio >= 0.2 ? 'warn' : 'fail',
      score: imgScore, max: 10,
      detail: `${responsiveImgs}/${totalImgs} images use srcset/sizes/<picture>. Use responsive images for faster mobile loading.` });
  }

  // --- Touch Target Sizing ---
  results.maxScore += 8;
  const smallButtons = [];
  const inlineStyles = $('[style*="font-size"]');
  let tinyElements = 0;
  inlineStyles.each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/font-size:\s*(\d+)/);
    if (match && parseInt(match[1]) < 12) tinyElements++;
  });
  const links = $('a');
  let adjacentLinks = 0;
  links.each((i, el) => {
    const text = $(el).text().trim();
    if (text.length <= 2 && text.length > 0) adjacentLinks++;
  });
  let touchScore = 8;
  const touchDetails = [];
  if (tinyElements > 0) { touchScore -= 2; touchDetails.push(`${tinyElements} elements with very small font-size`); }
  if (adjacentLinks > 5) { touchScore -= 2; touchDetails.push(`${adjacentLinks} very short link texts — may be hard to tap`); }
  touchScore = Math.max(0, touchScore);
  results.score += touchScore;
  results.checks.push({ name: 'Touch Targets', status: touchScore >= 6 ? 'pass' : 'warn',
    score: touchScore, max: 8,
    detail: touchDetails.length === 0
      ? 'Touch targets appear adequate. Ensure all interactive elements are at least 48x48px.'
      : `Touch target issues: ${touchDetails.join('; ')}. Min recommended: 48x48px.` });

  // --- Mobile-First Content ---
  results.maxScore += 8;
  let mobileScore = 8;
  const mobileDetails = [];
  // Check for horizontal scroll risks
  const fixedWidthElements = $('[style*="width:"]').filter((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/width:\s*(\d+)px/);
    return match && parseInt(match[1]) > 400;
  });
  if (fixedWidthElements.length > 0) { mobileScore -= 3; mobileDetails.push(`${fixedWidthElements.length} elements with fixed width >400px — may cause horizontal scroll`); }

  // Check for tables (often problematic on mobile)
  const tables = $('table');
  if (tables.length > 0) { mobileScore -= 1; mobileDetails.push(`${tables.length} tables found — ensure they are responsive on mobile`); }

  // Check for media queries in inline styles (good sign)
  const hasMediaQueries = html.includes('@media');
  if (hasMediaQueries) { mobileDetails.push('✓ CSS media queries detected'); }
  else { mobileScore -= 2; mobileDetails.push('No CSS media queries detected — may not be responsive'); }

  // Check for AMP
  const hasAmp = $('link[rel="amphtml"]').length > 0 || html.includes('⚡') || $('html[amp]').length > 0;
  if (hasAmp) { mobileDetails.push('✓ AMP version available'); }

  mobileScore = Math.max(0, mobileScore);
  results.score += mobileScore;
  results.checks.push({ name: 'Mobile-First Design', status: mobileScore >= 6 ? 'pass' : 'warn',
    score: mobileScore, max: 8,
    detail: mobileDetails.length === 0
      ? 'Good mobile-first design indicators.'
      : mobileDetails.join('. ') });

  // --- Text Readability on Mobile ---
  results.maxScore += 7;
  let readScore = 7;
  const readDetails = [];
  const baseFontSize = html.match(/font-size:\s*(\d+)px/) ? parseInt(html.match(/font-size:\s*(\d+)px/)[1]) : 16;
  if (baseFontSize < 14) { readScore -= 3; readDetails.push(`Base font size appears small (${baseFontSize}px). Use 16px+ for mobile.`); }
  // Check line-height
  const hasLineHeight = html.includes('line-height');
  if (!hasLineHeight) { readScore -= 1; readDetails.push('No explicit line-height found. Use 1.5+ for readability.'); }

  readScore = Math.max(0, readScore);
  results.score += readScore;
  results.checks.push({ name: 'Mobile Readability', status: readScore >= 5 ? 'pass' : 'warn',
    score: readScore, max: 7,
    detail: readDetails.length === 0
      ? 'Good mobile readability indicators. Base font size and spacing appear adequate.'
      : readDetails.join(' ') });

  return results;
}

module.exports = { analyzeMobileSEO };
