/**
 * Competitor Keyword Analyzer
 * Extracts keyword data from a page and compares with competitor pages
 */
function extractKeywords($, html) {
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().toLowerCase();
  const title = $('title').first().text().trim().toLowerCase();
  const metaDesc = ($('meta[name="description"]').attr('content') || '').toLowerCase();
  const h1Text = $('h1').map((_, el) => $(el).text().trim().toLowerCase()).get().join(' ');
  const h2Text = $('h2').map((_, el) => $(el).text().trim().toLowerCase()).get().join(' ');

  // Extract words, filter stop words
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','it','as','was','are','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','i','you','he','she','we','they','me','him','her','us','them','my','your','his','its','our','their','what','which','who','whom','when','where','why','how','all','each','every','both','few','more','most','other','some','such','no','not','only','own','same','so','than','too','very','just','about','above','after','again','also','any','because','before','between','during','into','over','then','there','through','under','until','up','down','out','off','if','else','here','new','now','old','see','way','get','go','come','make','like','time','just','know','take','people','into','year','your','good','some','them','than','then','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','even','want','because','any','give','day','most','us']);
  const words = bodyText.split(/[\s,.;:!?()[\]{}"'\/\\<>]+/).filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  // Count word frequency
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Extract 2-word phrases
  const phrases = {};
  const wordArr = bodyText.split(/\s+/).filter(w => w.length > 2);
  for (let i = 0; i < wordArr.length - 1; i++) {
    const phrase = `${wordArr[i]} ${wordArr[i + 1]}`;
    if (!stopWords.has(wordArr[i]) && !stopWords.has(wordArr[i + 1])) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }

  // Score keywords by importance
  const scored = {};
  Object.entries(freq).forEach(([word, count]) => {
    if (count < 2) return;
    let score = count;
    if (title.includes(word)) score *= 3;
    if (metaDesc.includes(word)) score *= 2;
    if (h1Text.includes(word)) score *= 2.5;
    if (h2Text.includes(word)) score *= 1.5;
    scored[word] = { word, count, score: Math.round(score * 10) / 10 };
  });

  const topKeywords = Object.values(scored).sort((a, b) => b.score - a.score).slice(0, 20);
  const topPhrases = Object.entries(phrases)
    .filter(([_, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase, count]) => ({ phrase, count }));

  const totalWords = words.length;
  return { topKeywords, topPhrases, totalWords, title: $('title').first().text().trim(), metaDesc: $('meta[name="description"]').attr('content') || '' };
}

function analyzeCompetitor($target, $competitors) {
  const targetData = extractKeywords($target);
  const competitorData = $competitors.map(c => extractKeywords(c));

  // Find keyword gaps
  const targetKws = new Set(targetData.topKeywords.map(k => k.word));
  const gaps = [];
  competitorData.forEach((comp, i) => {
    comp.topKeywords.forEach(kw => {
      if (!targetKws.has(kw.word) && kw.score > 5) {
        gaps.push({ keyword: kw.word, score: kw.score, competitor: i + 1 });
      }
    });
  });

  // Deduplicate and sort gaps
  const uniqueGaps = {};
  gaps.forEach(g => {
    if (!uniqueGaps[g.keyword] || uniqueGaps[g.keyword].score < g.score) {
      uniqueGaps[g.keyword] = g;
    }
  });
  const sortedGaps = Object.values(uniqueGaps).sort((a, b) => b.score - a.score).slice(0, 20);

  return { target: targetData, competitors: competitorData, keywordGaps: sortedGaps };
}

module.exports = { extractKeywords, analyzeCompetitor };
