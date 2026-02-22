const express = require('express');
const path = require('path');
const { fetchPage, parsePage } = require('./src/utils/fetcher');
const { analyzeContentSEO } = require('./src/analyzers/content-seo');
const { analyzeTechnicalSEO } = require('./src/analyzers/technical-seo');
const { analyzeCoreWebVitals } = require('./src/analyzers/core-web-vitals');
const { analyzeMobileSEO } = require('./src/analyzers/mobile-seo');
const { analyzeSocialSEO } = require('./src/analyzers/social-seo');
const { analyzeAISearch } = require('./src/analyzers/ai-search');
const { analyzePageSpeed } = require('./src/analyzers/speed');
const { extractKeywords, analyzeCompetitor } = require('./src/analyzers/competitor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Main SEO analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { url, keyword, competitors } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const startTime = Date.now();

    // Fetch the page
    const { html, status, headers, finalUrl } = await fetchPage(normalizedUrl);
    const $ = parsePage(html);
    const fetchTime = Date.now() - startTime;

    // Run all analyzers in parallel
    const [contentSEO, technicalSEO, coreWebVitals, mobileSEO, socialSEO, aiSearch, pageSpeed] = await Promise.all([
      analyzeContentSEO($, finalUrl, keyword),
      analyzeTechnicalSEO($, finalUrl, headers),
      analyzeCoreWebVitals($, html, headers),
      analyzeMobileSEO($, html, headers),
      analyzeSocialSEO($, finalUrl),
      analyzeAISearch($, html, finalUrl),
      analyzePageSpeed($, html, headers),
    ]);

    // Extract keywords
    const keywords = extractKeywords($, html);

    // Competitor analysis if URLs provided
    let competitorAnalysis = null;
    if (competitors && competitors.length > 0) {
      try {
        const compPages = await Promise.all(
          competitors.filter(c => c.trim()).slice(0, 3).map(async (compUrl) => {
            const normalized = compUrl.startsWith('http') ? compUrl : `https://${compUrl}`;
            const { html: compHtml } = await fetchPage(normalized);
            return parsePage(compHtml);
          })
        );
        competitorAnalysis = analyzeCompetitor($, compPages);
      } catch (e) {
        competitorAnalysis = { error: `Competitor analysis failed: ${e.message}` };
      }
    }

    // Calculate overall score
    const categories = { contentSEO, technicalSEO, coreWebVitals, mobileSEO, socialSEO, aiSearch, pageSpeed };
    let totalScore = 0, totalMax = 0;
    Object.values(categories).forEach(cat => {
      totalScore += cat.score;
      totalMax += cat.maxScore;
    });
    const overallScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    res.json({
      url: finalUrl,
      status,
      fetchTime,
      overallScore,
      totalScore,
      totalMax,
      categories,
      keywords,
      competitorAnalysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: `Analysis failed: ${err.message}` });
  }
});

// Quick keyword extraction endpoint
app.post('/api/keywords', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const { html } = await fetchPage(normalizedUrl);
    const $ = parsePage(html);
    const keywords = extractKeywords($, html);
    res.json(keywords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  🚀 SEOPilot is running at http://localhost:${PORT}\n`);
});
