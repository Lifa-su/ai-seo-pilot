/**
 * Content SEO Analyzer
 * Checks: title, meta description, headings, keyword density, content quality
 */
function analyzeContentSEO($, url, keyword = '') {
  const results = { score: 0, maxScore: 0, checks: [] };

  // --- Title Tag ---
  const title = $('title').first().text().trim();
  results.maxScore += 10;
  if (!title) {
    results.checks.push({ name: 'Title Tag', status: 'fail', score: 0, max: 10, detail: 'Missing <title> tag. Every page needs a unique, descriptive title.' });
  } else if (title.length < 30) {
    results.score += 4;
    results.checks.push({ name: 'Title Tag', status: 'warn', score: 4, max: 10, detail: `Title is too short (${title.length} chars). Aim for 50-60 characters. Current: "${title}"` });
  } else if (title.length > 60) {
    results.score += 6;
    results.checks.push({ name: 'Title Tag', status: 'warn', score: 6, max: 10, detail: `Title may be truncated in SERPs (${title.length} chars). Keep under 60. Current: "${title}"` });
  } else {
    results.score += 10;
    results.checks.push({ name: 'Title Tag', status: 'pass', score: 10, max: 10, detail: `Good title length (${title.length} chars): "${title}"` });
  }

  // --- Meta Description ---
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  results.maxScore += 10;
  if (!metaDesc) {
    results.checks.push({ name: 'Meta Description', status: 'fail', score: 0, max: 10, detail: 'Missing meta description. Add a compelling 150-160 character description.' });
  } else if (metaDesc.length < 120) {
    results.score += 5;
    results.checks.push({ name: 'Meta Description', status: 'warn', score: 5, max: 10, detail: `Meta description is short (${metaDesc.length} chars). Aim for 150-160 characters.` });
  } else if (metaDesc.length > 160) {
    results.score += 7;
    results.checks.push({ name: 'Meta Description', status: 'warn', score: 7, max: 10, detail: `Meta description may be truncated (${metaDesc.length} chars). Keep under 160.` });
  } else {
    results.score += 10;
    results.checks.push({ name: 'Meta Description', status: 'pass', score: 10, max: 10, detail: `Good meta description length (${metaDesc.length} chars).` });
  }

  // --- H1 Tag ---
  const h1s = $('h1');
  results.maxScore += 10;
  if (h1s.length === 0) {
    results.checks.push({ name: 'H1 Heading', status: 'fail', score: 0, max: 10, detail: 'No H1 tag found. Each page should have exactly one H1.' });
  } else if (h1s.length > 1) {
    results.score += 5;
    results.checks.push({ name: 'H1 Heading', status: 'warn', score: 5, max: 10, detail: `Multiple H1 tags found (${h1s.length}). Best practice is to use exactly one H1 per page.` });
  } else {
    results.score += 10;
    results.checks.push({ name: 'H1 Heading', status: 'pass', score: 10, max: 10, detail: `Single H1 found: "${h1s.first().text().trim().substring(0, 80)}"` });
  }

  // --- Heading Hierarchy ---
  const headings = { h1: h1s.length, h2: $('h2').length, h3: $('h3').length, h4: $('h4').length, h5: $('h5').length, h6: $('h6').length };
  results.maxScore += 8;
  const totalHeadings = Object.values(headings).reduce((a, b) => a + b, 0);
  if (totalHeadings < 3) {
    results.score += 3;
    results.checks.push({ name: 'Heading Structure', status: 'warn', score: 3, max: 8, detail: `Only ${totalHeadings} headings found. Use more headings (H2, H3) to structure content. Distribution: ${JSON.stringify(headings)}` });
  } else if (headings.h2 === 0) {
    results.score += 4;
    results.checks.push({ name: 'Heading Structure', status: 'warn', score: 4, max: 8, detail: `No H2 tags found. Use H2 for main sections. Distribution: ${JSON.stringify(headings)}` });
  } else {
    results.score += 8;
    results.checks.push({ name: 'Heading Structure', status: 'pass', score: 8, max: 8, detail: `Good heading structure. Distribution: ${JSON.stringify(headings)}` });
  }

  // --- Content Length ---
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  results.maxScore += 8;
  if (wordCount < 100) {
    results.checks.push({ name: 'Content Length', status: 'fail', score: 0, max: 8, detail: `Very thin content (${wordCount} words). Aim for at least 300+ words for meaningful pages.` });
  } else if (wordCount < 300) {
    results.score += 3;
    results.checks.push({ name: 'Content Length', status: 'warn', score: 3, max: 8, detail: `Thin content (${wordCount} words). Consider expanding to 600+ words for better rankings.` });
  } else if (wordCount < 600) {
    results.score += 6;
    results.checks.push({ name: 'Content Length', status: 'warn', score: 6, max: 8, detail: `Moderate content (${wordCount} words). Longer, comprehensive content tends to rank better.` });
  } else {
    results.score += 8;
    results.checks.push({ name: 'Content Length', status: 'pass', score: 8, max: 8, detail: `Good content length (${wordCount} words).` });
  }

  // --- Keyword Analysis ---
  if (keyword) {
    const kw = keyword.toLowerCase();
    const titleHasKw = title.toLowerCase().includes(kw);
    const descHasKw = metaDesc.toLowerCase().includes(kw);
    const h1HasKw = h1s.length > 0 && h1s.first().text().toLowerCase().includes(kw);
    const bodyLower = bodyText.toLowerCase();
    const kwCount = bodyLower.split(kw).length - 1;
    const density = wordCount > 0 ? ((kwCount / wordCount) * 100).toFixed(2) : 0;

    results.maxScore += 10;
    let kwScore = 0;
    const kwDetails = [];
    if (titleHasKw) { kwScore += 3; kwDetails.push('✓ Found in title'); } else { kwDetails.push('✗ Not in title'); }
    if (descHasKw) { kwScore += 2; kwDetails.push('✓ Found in meta description'); } else { kwDetails.push('✗ Not in meta description'); }
    if (h1HasKw) { kwScore += 3; kwDetails.push('✓ Found in H1'); } else { kwDetails.push('✗ Not in H1'); }
    if (density >= 0.5 && density <= 2.5) { kwScore += 2; kwDetails.push(`✓ Good density: ${density}%`); }
    else if (density > 2.5) { kwScore += 1; kwDetails.push(`⚠ High density: ${density}% (may look spammy)`); }
    else { kwDetails.push(`⚠ Low density: ${density}%`); }

    results.score += kwScore;
    results.checks.push({
      name: 'Keyword Optimization',
      status: kwScore >= 8 ? 'pass' : kwScore >= 5 ? 'warn' : 'fail',
      score: kwScore, max: 10,
      detail: `Keyword "${keyword}" analysis (${kwCount} occurrences, ${density}% density):\n${kwDetails.join('\n')}`
    });
  }

  // --- Image Alt Tags ---
  const images = $('img');
  const imagesWithAlt = $('img[alt]').filter((_, el) => $(el).attr('alt').trim().length > 0);
  results.maxScore += 6;
  if (images.length === 0) {
    results.score += 3;
    results.checks.push({ name: 'Image Alt Tags', status: 'warn', score: 3, max: 6, detail: 'No images found. Consider adding relevant images to improve engagement.' });
  } else {
    const altRatio = images.length > 0 ? imagesWithAlt.length / images.length : 0;
    if (altRatio >= 0.9) {
      results.score += 6;
      results.checks.push({ name: 'Image Alt Tags', status: 'pass', score: 6, max: 6, detail: `${imagesWithAlt.length}/${images.length} images have alt text. Great for accessibility and SEO.` });
    } else if (altRatio >= 0.5) {
      results.score += 3;
      results.checks.push({ name: 'Image Alt Tags', status: 'warn', score: 3, max: 6, detail: `Only ${imagesWithAlt.length}/${images.length} images have alt text. Add descriptive alt attributes.` });
    } else {
      results.checks.push({ name: 'Image Alt Tags', status: 'fail', score: 0, max: 6, detail: `Only ${imagesWithAlt.length}/${images.length} images have alt text. Most images are missing alt attributes.` });
    }
  }

  // --- Internal & External Links ---
  const links = $('a[href]');
  let internalLinks = 0, externalLinks = 0, nofollowLinks = 0;
  try {
    const baseHost = new URL(url).hostname;
    links.each((_, el) => {
      const href = $(el).attr('href') || '';
      const rel = ($(el).attr('rel') || '').toLowerCase();
      if (rel.includes('nofollow')) nofollowLinks++;
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === baseHost) internalLinks++;
        else externalLinks++;
      } catch { internalLinks++; }
    });
  } catch {}

  results.maxScore += 6;
  if (internalLinks === 0 && externalLinks === 0) {
    results.checks.push({ name: 'Link Profile', status: 'fail', score: 0, max: 6, detail: 'No links found. Add internal links for navigation and external links for credibility.' });
  } else if (internalLinks < 3) {
    results.score += 3;
    results.checks.push({ name: 'Link Profile', status: 'warn', score: 3, max: 6, detail: `Few internal links (${internalLinks}). Add more internal links to improve site structure. External: ${externalLinks}, Nofollow: ${nofollowLinks}` });
  } else {
    results.score += 6;
    results.checks.push({ name: 'Link Profile', status: 'pass', score: 6, max: 6, detail: `Good link profile. Internal: ${internalLinks}, External: ${externalLinks}, Nofollow: ${nofollowLinks}` });
  }

  return results;
}

module.exports = { analyzeContentSEO };
