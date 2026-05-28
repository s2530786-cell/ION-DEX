---
name: firecrawl
description: >-
  Firecrawl web scraping/search skill for ION DEX. Use for live web fetch, crawl,
  and extraction tasks. Works with skill-route and scraping stack routing.
---

# Firecrawl Skill (ION DEX)

Use this skill when tasks include:

- Web scraping / crawling / extracting page content
- Reading docs from URLs for implementation details
- Scrapy / Scrapling / Obscura / Firecrawl stack research
- Replacing brittle manual parsing with structured web extraction

## Local setup

1. Ensure CLI is available:

```powershell
npx -y firecrawl-cli@latest --help
```

2. Initialize MCP wiring (recommended):

```powershell
npx -y firecrawl-cli@latest init --all --browser
```

3. Set API key (`fc-...`) in environment for sessions that call Firecrawl:

```powershell
$env:FIRECRAWL_API_KEY = "fc-REPLACE_ME"
```

## Routing integration

- Referenced by `.cursor/skill-routing.manifest.json` in scraping keyword route.
- `skill-route.mjs` will auto-load this skill for:
  - `firecrawl`, `scrapy`, `scrapling`, `obscura`, `portia`
  - `爬虫`, `抓取`, `crawl`, `crawler`, `web scraping`

## Usage guidance

- Prefer Firecrawl for live web pages and docs extraction.
- Prefer project-local code parsing for repository files already cloned locally.
- If API key/auth is missing, fail fast with explicit setup command and continue with non-network fallback where possible.

