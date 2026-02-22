/**
 * AI Search / AEO (Answer Engine Optimization) Analyzer
 * Checks readiness for Google SGE, ChatGPT, Perplexity, Gemini citations
 * Based on 2025/2026 AEO best practices
 */
function analyzeAISearch($, html, url) {
  const results = { score: 0, maxScore: 0, checks: [] };

  // --- Structured Data for AI ---
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const schemas = [];
  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type']) schemas.push(data['@type']);
      if (Array.isArray(data['@graph'])) data['@graph'].forEach(i => { if (i['@type']) schemas.push(i['@type']); });
    } catch {}
  });
  const aiSchemas = ['FAQPage', 'HowTo', 'Article', 'NewsArticle', 'TechArticle', 'QAPage', 'Dataset'];
  const foundAISchemas = schemas.filter(s => aiSchemas.includes(s));
  results.maxScore += 12;
  if (foundAISchemas.length > 0) {
    results.score += 12;
    results.checks.push({ name: 'AI-Friendly Schema', status: 'pass', score: 12, max: 12,
      detail: `AI-optimized schema types found: ${foundAISchemas.join(', ')}. These help AI engines understand and cite your content.` });
  } else if (schemas.length > 0) {
    results.score += 6;
    results.checks.push({ name: 'AI-Friendly Schema', status: 'warn', score: 6, max: 12,
      detail: `Schema found (${schemas.join(', ')}) but consider adding FAQ, HowTo, or Article schema for better AI citation.` });
  } else {
    results.checks.push({ name: 'AI-Friendly Schema', status: 'fail', score: 0, max: 12,
      detail: 'No structured data. Add FAQPage, HowTo, or Article schema to increase chances of AI engine citations.' });
  }

  // --- FAQ Content Pattern ---
  results.maxScore += 10;
  const bodyText = $('body').text().toLowerCase();
  const hasFAQSection = bodyText.includes('frequently asked') || bodyText.includes('faq') || $('[itemtype*="FAQPage"]').length > 0;
  const questionPatterns = $('h2, h3, h4').filter((_, el) => {
    const text = $(el).text().trim();
    return text.endsWith('?') || text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('what') || text.toLowerCase().startsWith('why');
  });
  if (hasFAQSection || questionPatterns.length >= 3) {
    results.score += 10;
    results.checks.push({ name: 'Q&A Content Pattern', status: 'pass', score: 10, max: 10,
      detail: `Strong Q&A content pattern detected (${questionPatterns.length} question headings). AI engines prefer clear question-answer formats.` });
  } else if (questionPatterns.length >= 1) {
    results.score += 5;
    results.checks.push({ name: 'Q&A Content Pattern', status: 'warn', score: 5, max: 10,
      detail: `${questionPatterns.length} question heading(s) found. Add more Q&A-style content for better AI search visibility.` });
  } else {
    results.checks.push({ name: 'Q&A Content Pattern', status: 'fail', score: 0, max: 10,
      detail: 'No Q&A content pattern detected. Structure content with question headings (H2/H3) for AI answer engines.' });
  }

  // --- Content Clarity & Conciseness ---
  results.maxScore += 10;
  const paragraphs = $('p');
  let shortParas = 0, totalParas = 0;
  paragraphs.each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) {
      totalParas++;
      if (text.split(/\s+/).length <= 50) shortParas++;
    }
  });
  if (totalParas === 0) {
    results.score += 3;
    results.checks.push({ name: 'Content Clarity', status: 'warn', score: 3, max: 10,
      detail: 'No substantial paragraphs found. AI engines prefer clear, well-structured paragraphs.' });
  } else {
    const clarityRatio = shortParas / totalParas;
    const clarityScore = Math.round(clarityRatio * 10);
    results.score += clarityScore;
    results.checks.push({ name: 'Content Clarity', status: clarityScore >= 7 ? 'pass' : 'warn',
      score: clarityScore, max: 10,
      detail: `${shortParas}/${totalParas} paragraphs are concise (≤50 words). AI engines prefer direct, scannable answers.` });
  }

  // --- Authoritative Signals (E-E-A-T) ---
  results.maxScore += 10;
  let eeatScore = 0;
  const eeatDetails = [];
  // Author info
  const hasAuthor = $('[rel="author"], .author, [itemprop="author"], meta[name="author"]').length > 0;
  if (hasAuthor) { eeatScore += 3; eeatDetails.push('✓ Author attribution found'); }
  else { eeatDetails.push('✗ No author info — add author name and credentials'); }
  // Published/modified dates
  const hasDate = $('time, [itemprop="datePublished"], [itemprop="dateModified"], meta[property="article:published_time"]').length > 0;
  if (hasDate) { eeatScore += 2; eeatDetails.push('✓ Publication date found'); }
  else { eeatDetails.push('✗ No publication date — add for freshness signals'); }
  // Citations/references
  const hasCitations = $('a[href*="wikipedia"], a[href*=".gov"], a[href*=".edu"], cite, blockquote').length > 0;
  if (hasCitations) { eeatScore += 2; eeatDetails.push('✓ External citations/references found'); }
  else { eeatDetails.push('✗ No citations — link to authoritative sources'); }
  // About page link
  const hasAbout = $('a[href*="about"], a[href*="team"], a[href*="author"]').length > 0;
  if (hasAbout) { eeatScore += 2; eeatDetails.push('✓ About/team page linked'); }
  else { eeatDetails.push('✗ No about/team link — add for trust signals'); }
  // Contact info
  const hasContact = $('a[href*="contact"], a[href^="mailto:"], a[href^="tel:"]').length > 0;
  if (hasContact) { eeatScore += 1; eeatDetails.push('✓ Contact info available'); }

  results.score += eeatScore;
  results.checks.push({ name: 'E-E-A-T Signals', status: eeatScore >= 7 ? 'pass' : eeatScore >= 4 ? 'warn' : 'fail',
    score: eeatScore, max: 10, detail: eeatDetails.join('. ') });

  // --- AI Crawlability ---
  results.maxScore += 8;
  let crawlScore = 8;
  const crawlDetails = [];
  // Check for AI bot blocking
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  if (robotsMeta.includes('noai') || robotsMeta.includes('noimageai')) {
    crawlScore -= 4; crawlDetails.push('⚠ AI crawling restricted via meta robots');
  }
  // Check for clean HTML structure
  const hasSemanticHTML = $('article, section, main, aside, nav, header, footer').length > 0;
  if (hasSemanticHTML) { crawlDetails.push('✓ Semantic HTML elements used'); }
  else { crawlScore -= 2; crawlDetails.push('Use semantic HTML (article, section, main) for better AI parsing'); }
  // Check for clean text-to-HTML ratio
  const htmlLen = html.length;
  const textLen = $('body').text().replace(/\s+/g, ' ').trim().length;
  const textRatio = textLen / htmlLen;
  if (textRatio < 0.1) { crawlScore -= 2; crawlDetails.push(`Low text-to-HTML ratio (${(textRatio * 100).toFixed(1)}%) — content may be hard for AI to extract`); }
  else { crawlDetails.push(`Text-to-HTML ratio: ${(textRatio * 100).toFixed(1)}%`); }

  crawlScore = Math.max(0, crawlScore);
  results.score += crawlScore;
  results.checks.push({ name: 'AI Crawlability', status: crawlScore >= 6 ? 'pass' : 'warn',
    score: crawlScore, max: 8, detail: crawlDetails.join('. ') });

  return results;
}

module.exports = { analyzeAISearch };
