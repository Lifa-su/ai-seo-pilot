# SEOPilot — AI-Powered SEO Optimization Tool

A comprehensive SEO analysis tool built for 2025/2026 standards. Analyzes any webpage across 7 categories with 50+ individual checks.

## Features

- **Content SEO** — Title, meta description, headings, keyword density, content length, link profile
- **Technical SEO** — HTTPS, canonical, robots.txt, sitemap, structured data (JSON-LD), hreflang
- **Core Web Vitals** — LCP, INP (replaced FID in 2024), CLS, 2026 Engagement Reliability
- **Mobile SEO** — Viewport, responsive images, touch targets, mobile-first design
- **Social Media SEO** — Open Graph, Twitter Card, social profile links
- **AI Search / AEO** — Answer Engine Optimization for Google SGE, ChatGPT, Perplexity, E-E-A-T signals
- **Page Speed** — HTML size, image optimization, CSS/JS optimization, compression, caching, resource hints
- **Competitor Analysis** — Keyword extraction, phrase analysis, keyword gap identification
- **Bilingual UI** — English (primary) + Chinese

## Quick Start

```bash
npm install
npm start
# Open http://localhost:3000
```

## Tech Stack

- Node.js + Express
- Cheerio (HTML parsing)
- Vanilla JS frontend (no framework dependencies)

## 2025/2026 SEO Standards

- INP (Interaction to Next Paint) replaces FID as Core Web Vital
- AEO (Answer Engine Optimization) for AI search engines
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- JSON-LD structured data (recommended over Microdata/RDFa)
- Core Web Vitals thresholds: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1

## License

MIT
