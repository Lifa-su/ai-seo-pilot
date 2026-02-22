/* SEOPilot - Frontend Application */
(function () {
  'use strict';

  // i18n translations
  const i18n = {
    en: {
      urlLabel: 'Website URL to analyze',
      analyzeBtn: 'Analyze',
      keywordLabel: 'Target keyword (optional)',
      competitorLabel: 'Competitor URLs (comma-separated, optional)',
      analyzing: 'Analyzing page SEO...',
      overallScore: 'Overall SEO Score',
      contentSEO: 'Content SEO',
      technicalSEO: 'Technical SEO',
      coreWebVitals: 'Core Web Vitals',
      mobileSEO: 'Mobile SEO',
      socialSEO: 'Social Media SEO',
      aiSearch: 'AI Search / AEO',
      pageSpeed: 'Page Speed',
      keywordsTitle: '🔑 Keyword Analysis',
      topKeywords: 'Top Keywords',
      topPhrases: 'Top Phrases',
      competitorTitle: '🏆 Competitor Analysis',
      fetchTime: 'Fetched in',
      ms: 'ms',
      keywordGaps: 'Keyword Gaps — terms competitors rank for that you may be missing',
    },
    zh: {
      urlLabel: '输入要分析的网站 URL',
      analyzeBtn: '开始分析',
      keywordLabel: '目标关键词（可选）',
      competitorLabel: '竞品 URL（逗号分隔，可选）',
      analyzing: '正在分析页面 SEO...',
      overallScore: '综合 SEO 评分',
      contentSEO: '内容 SEO',
      technicalSEO: '技术 SEO',
      coreWebVitals: '核心网页指标',
      mobileSEO: '移动端 SEO',
      socialSEO: '社交媒体 SEO',
      aiSearch: 'AI 搜索 / AEO',
      pageSpeed: '页面速度',
      keywordsTitle: '🔑 关键词分析',
      topKeywords: '高频关键词',
      topPhrases: '高频短语',
      competitorTitle: '🏆 竞品分析',
      fetchTime: '抓取耗时',
      ms: '毫秒',
      keywordGaps: '关键词差距 — 竞品有而你可能缺少的关键词',
    }
  };

  let currentLang = 'en';

  function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (i18n[lang][key]) el.textContent = i18n[lang][key];
    });
  }

  // DOM refs
  const urlInput = document.getElementById('url-input');
  const keywordInput = document.getElementById('keyword-input');
  const competitorInput = document.getElementById('competitor-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadingEl = document.getElementById('loading');
  const errorSection = document.getElementById('error-section');
  const errorMessage = document.getElementById('error-message');
  const resultsEl = document.getElementById('results');

  // Event listeners
  analyzeBtn.addEventListener('click', runAnalysis);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') runAnalysis(); });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  async function runAnalysis() {
    const url = urlInput.value.trim();
    if (!url) { urlInput.focus(); return; }

    const keyword = keywordInput.value.trim();
    const competitors = competitorInput.value.split(',').map(s => s.trim()).filter(Boolean);

    // UI state
    analyzeBtn.disabled = true;
    loadingEl.classList.remove('hidden');
    errorSection.classList.add('hidden');
    resultsEl.classList.add('hidden');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, keyword, competitors }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      renderResults(data);
    } catch (err) {
      errorMessage.textContent = err.message;
      errorSection.classList.remove('hidden');
    } finally {
      analyzeBtn.disabled = false;
      loadingEl.classList.add('hidden');
    }
  }

  function renderResults(data) {
    resultsEl.classList.remove('hidden');

    // Overall score
    const score = data.overallScore;
    document.getElementById('overall-score').textContent = score;
    document.getElementById('score-url').textContent = data.url;
    const t = i18n[currentLang];
    document.getElementById('score-time').textContent = `${t.fetchTime} ${data.fetchTime}${t.ms} · ${new Date(data.analyzedAt).toLocaleString()}`;

    // Score ring animation
    const ring = document.getElementById('score-ring-fill');
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (score / 100) * circumference;
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('overall-score').style.color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';

    // Category cards
    const categories = ['contentSEO', 'technicalSEO', 'coreWebVitals', 'mobileSEO', 'socialSEO', 'aiSearch', 'pageSpeed'];
    categories.forEach(cat => {
      const catData = data.categories[cat];
      if (!catData) return;
      const pct = catData.maxScore > 0 ? Math.round((catData.score / catData.maxScore) * 100) : 0;
      const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

      document.getElementById(`score-${cat}`).textContent = `${pct}%`;
      document.getElementById(`score-${cat}`).style.color = color;

      const bar = document.getElementById(`bar-${cat}`);
      bar.style.width = `${pct}%`;
      bar.style.background = color;

      const checksEl = document.getElementById(`checks-${cat}`);
      checksEl.innerHTML = catData.checks.map(check => `
        <div class="check-item">
          <div class="check-status ${check.status}">${check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗'}</div>
          <div class="check-body">
            <div class="check-name">${check.name} <span class="check-score">${check.score}/${check.max}</span></div>
            <div class="check-detail">${check.detail}</div>
          </div>
        </div>
      `).join('');
    });

    // Keywords
    const kwEl = document.getElementById('top-keywords');
    if (data.keywords && data.keywords.topKeywords) {
      kwEl.innerHTML = data.keywords.topKeywords.slice(0, 15).map(kw => `
        <div class="kw-item">
          <span class="kw-word">${escapeHtml(kw.word)}</span>
          <span class="kw-count">×${kw.count}</span>
          <div class="kw-bar-mini"><div class="kw-bar-mini-fill" style="width:${Math.min(100, kw.score * 2)}%"></div></div>
        </div>
      `).join('');
    }

    const phEl = document.getElementById('top-phrases');
    if (data.keywords && data.keywords.topPhrases) {
      phEl.innerHTML = data.keywords.topPhrases.slice(0, 12).map(ph => `
        <div class="kw-item">
          <span class="kw-word">${escapeHtml(ph.phrase)}</span>
          <span class="kw-count">×${ph.count}</span>
        </div>
      `).join('');
    }

    // Competitor analysis
    const compSection = document.getElementById('competitor-section');
    const compResults = document.getElementById('competitor-results');
    if (data.competitorAnalysis && !data.competitorAnalysis.error) {
      compSection.classList.remove('hidden');
      let compHtml = '';
      if (data.competitorAnalysis.keywordGaps && data.competitorAnalysis.keywordGaps.length > 0) {
        compHtml += `<div class="comp-card"><h3>${t.keywordGaps}</h3><div class="gap-list">`;
        data.competitorAnalysis.keywordGaps.forEach(gap => {
          compHtml += `<div class="gap-item"><span class="gap-keyword">${escapeHtml(gap.keyword)}</span><span class="gap-score">(${gap.score})</span></div>`;
        });
        compHtml += '</div></div>';
      }
      if (data.competitorAnalysis.competitors) {
        data.competitorAnalysis.competitors.forEach((comp, i) => {
          compHtml += `<div class="comp-card"><h3>Competitor ${i + 1}: ${escapeHtml(comp.title || 'Unknown')}</h3>`;
          compHtml += `<p style="color:var(--text2);font-size:13px;margin-bottom:8px">${comp.totalWords} words · Top keywords: ${comp.topKeywords.slice(0, 8).map(k => k.word).join(', ')}</p></div>`;
        });
      }
      compResults.innerHTML = compHtml;
    } else {
      compSection.classList.add('hidden');
    }

    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
