/**
 * Social Media SEO Analyzer
 * Checks: Open Graph, Twitter Card, social sharing readiness
 */
function analyzeSocialSEO($, url) {
  const results = { score: 0, maxScore: 0, checks: [] };

  // --- Open Graph Tags ---
  const ogTags = {};
  $('meta[property^="og:"]').each((_, el) => {
    ogTags[$(el).attr('property')] = $(el).attr('content') || '';
  });
  const requiredOG = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  results.maxScore += 15;
  const foundOG = requiredOG.filter(t => ogTags[t]);
  const missingOG = requiredOG.filter(t => !ogTags[t]);
  const ogScore = Math.round((foundOG.length / requiredOG.length) * 15);
  results.score += ogScore;
  results.checks.push({
    name: 'Open Graph Tags',
    status: missingOG.length === 0 ? 'pass' : missingOG.length <= 2 ? 'warn' : 'fail',
    score: ogScore, max: 15,
    detail: missingOG.length === 0
      ? `All essential OG tags present: ${foundOG.join(', ')}`
      : `Missing OG tags: ${missingOG.join(', ')}. Found: ${foundOG.join(', ') || 'none'}`
  });

  // --- OG Image Quality ---
  results.maxScore += 8;
  if (ogTags['og:image']) {
    let imgScore = 6;
    const details = [`OG image: ${ogTags['og:image'].substring(0, 80)}`];
    if (ogTags['og:image:width'] && ogTags['og:image:height']) {
      imgScore += 2;
      details.push(`Dimensions: ${ogTags['og:image:width']}x${ogTags['og:image:height']}`);
    } else {
      details.push('Add og:image:width and og:image:height (recommended: 1200x630)');
    }
    if (ogTags['og:image:alt']) { details.push('✓ og:image:alt present'); }
    else { imgScore -= 1; details.push('Add og:image:alt for accessibility'); }
    imgScore = Math.max(0, imgScore);
    results.score += imgScore;
    results.checks.push({ name: 'OG Image', status: imgScore >= 6 ? 'pass' : 'warn', score: imgScore, max: 8, detail: details.join('. ') });
  } else {
    results.checks.push({ name: 'OG Image', status: 'fail', score: 0, max: 8, detail: 'No og:image tag. Add a 1200x630px image for social sharing.' });
  }

  // --- Twitter Card ---
  const twitterTags = {};
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    twitterTags[name] = $(el).attr('content') || '';
  });
  const requiredTwitter = ['twitter:card', 'twitter:title', 'twitter:description'];
  results.maxScore += 12;
  const foundTW = requiredTwitter.filter(t => twitterTags[t]);
  const missingTW = requiredTwitter.filter(t => !twitterTags[t]);
  // Twitter falls back to OG, so partial credit if OG exists
  let twScore = Math.round((foundTW.length / requiredTwitter.length) * 12);
  if (missingTW.length > 0 && ogTags['og:title'] && ogTags['og:description']) {
    twScore = Math.max(twScore, 6); // OG fallback
  }
  results.score += twScore;
  results.checks.push({
    name: 'Twitter Card',
    status: missingTW.length === 0 ? 'pass' : twScore >= 6 ? 'warn' : 'fail',
    score: twScore, max: 12,
    detail: missingTW.length === 0
      ? `Twitter Card configured: ${twitterTags['twitter:card'] || 'summary'}. Tags: ${foundTW.join(', ')}`
      : `Missing: ${missingTW.join(', ')}. ${twScore >= 6 ? 'OG tags provide fallback.' : 'Add Twitter Card meta tags.'}`
  });

  // --- Twitter Image ---
  results.maxScore += 5;
  const twImg = twitterTags['twitter:image'] || ogTags['og:image'];
  if (twImg) {
    results.score += 5;
    results.checks.push({ name: 'Twitter Image', status: 'pass', score: 5, max: 5, detail: `Twitter image available: ${twImg.substring(0, 80)}` });
  } else {
    results.checks.push({ name: 'Twitter Image', status: 'fail', score: 0, max: 5, detail: 'No Twitter image or OG image fallback. Add twitter:image for rich sharing.' });
  }

  // --- Social Profile Links ---
  results.maxScore += 5;
  const socialDomains = ['facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com', 'github.com'];
  const socialLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    socialDomains.forEach(d => { if (href.includes(d) && !socialLinks.includes(d)) socialLinks.push(d); });
  });
  if (socialLinks.length > 0) {
    results.score += Math.min(5, socialLinks.length + 2);
    results.checks.push({ name: 'Social Profile Links', status: 'pass', score: Math.min(5, socialLinks.length + 2), max: 5,
      detail: `Social profiles linked: ${socialLinks.join(', ')}` });
  } else {
    results.checks.push({ name: 'Social Profile Links', status: 'warn', score: 0, max: 5,
      detail: 'No social media profile links found. Add links to your social profiles for brand authority.' });
  }

  return results;
}

module.exports = { analyzeSocialSEO };
