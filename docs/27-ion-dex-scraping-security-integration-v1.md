# ION DEX Scraping + Security Integration Checklist v1

This checklist defines how to integrate the scraping stack into ION DEX and how to isolate offensive security tooling in Docker sandbox profiles.

## 1) Scope and principle

- Business chain (production-facing): only scraping/data enrichment capabilities.
- Security chain (sandbox-only): offensive/recon tools for controlled code-security testing.
- Hard separation:
  - No direct dependency from business API modules to offensive tool modules.
  - No production secrets in sandbox containers.
  - No outbound production network from offensive profiles by default.

## 2) Target repositories and value

### A-tier (business chain)

- `D4Vinci/Scrapling` (primary adaptive scraping engine)
- `firecrawl/firecrawl` (web search/scrape extraction fallback)
- `scrapy/scrapy` (crawler patterns and ecosystem)
- `scrapinghub/portia` (visual extraction reference, optional)

### B-tier (controlled scraping lab)

- `D4Vinci/patchright` (anti-detect Playwright driver)
- `D4Vinci/camoufox` (anti-detect browser)
- `D4Vinci/Scrapegraph-ai` (LLM extraction helper)

### Sandbox-only (not business main chain)

- Offensive/red-team/malware-like repos:
  - `Dr0p1t-Framework`, `PyLoggy`, `Palsy-Virus`, `Wormy`, `PyFlooder`, `ReverseHttp`
  - `One-Lin3r`, `QRLJacking`, `XOE`
- Recon tools (security team only):
  - `Cr3dOv3r`, `Clickjacking-Tester`, `Sublist3r`

## 3) Concrete integration points in current backend

Current gateway entry is `backend/src/gateway/routes.ts` with route handlers and service dispatch.

### Add new scraping module paths

- `backend/src/services/scraping/types.ts`
- `backend/src/services/scraping/schema.ts`
- `backend/src/services/scraping/client-scrapling.ts`
- `backend/src/services/scraping/client-firecrawl.ts`
- `backend/src/services/scraping/policy.ts`
- `backend/src/services/scraping/runner.ts`
- `backend/src/services/scraping/compliance.ts`

### Add API routes

- `backend/src/api/scraping.routes.ts`
  - `GET /api/scraping/health`
  - `POST /api/scraping/extract`
  - `POST /api/scraping/crawl`
  - `POST /api/scraping/enrich/news`

Then wire in `backend/src/gateway/routes.ts`:
- `if (url.pathname.startsWith("/api/scraping/"))` -> `handleScrapingRoute(...)`.

## 4) Interface schema (v1)

### Request: `POST /api/scraping/extract`

```json
{
  "source": {
    "url": "https://example.com/post/123",
    "kind": "news|blog|announcement|docs"
  },
  "mode": "scrapling|firecrawl|auto",
  "selectors": {
    "title": "h1",
    "content": "article",
    "publishedAt": "time[datetime]"
  },
  "options": {
    "timeoutMs": 12000,
    "maxRetries": 2,
    "respectRobots": true
  }
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "url": "https://example.com/post/123",
    "title": "Example Title",
    "contentText": "normalized plain text",
    "publishedAt": "2026-05-28T10:00:00.000Z",
    "sourceEngine": "scrapling",
    "confidence": 0.92
  },
  "meta": {
    "requestId": "req_xxx",
    "updatedAt": "2026-05-28T10:00:00.000Z",
    "stale": false
  }
}
```

### Validation rules

- URL allowlist / denylist required.
- `timeoutMs`: 1000..30000.
- `maxRetries`: 0..5.
- Block private IP ranges and localhost by default (SSRF guard).

## 5) Retry / rate-limit / resilience policy

- Retry policy:
  - network and 5xx: exponential backoff (250ms, 750ms, 1500ms), max 2-3 retries.
  - 4xx (except 429): no retry.
- Rate-limit:
  - per domain token bucket (default 1 rps, burst 3).
  - global scraper concurrency cap (default 10).
- Circuit breaker:
  - open after 5 failures in 1 minute per source domain.
  - half-open after 2 minutes.
- Cache:
  - content cache TTL 10 minutes (news) / 60 minutes (docs).
  - include provenance (`sourceEngine`, `fetchTs`, `etag/hash`).

## 6) Compliance and safety policy

- Respect robots.txt in normal mode.
- User-Agent must identify ION DEX crawler profile.
- Do not scrape endpoints requiring authentication unless explicitly approved.
- Keep legal/audit log per domain:
  - domain
  - fetch intent
  - timestamp
  - operator (service account)
- Secrets:
  - `FIRECRAWL_API_KEY` from env only.
  - never log API keys or auth headers.

## 7) Docker sandbox model for security tooling

Use `docker/security-sandbox/docker-compose.yml`:

- `sast-audit` profile:
  - static checks only (bandit, semgrep, etc.), read-only project mount.
- `scraping-lab` profile:
  - scrape stack experiments (Scrapling/Firecrawl integration tests).
- `offsec-lab` profile:
  - offensive tools, `network_mode: none`, read-only root FS, dropped capabilities.
  - no project secrets, no wallet keys, no prod tokens.

## 8) Phased rollout

### Phase P0

- implement `scraping.routes.ts` + `runner.ts`
- ship `extract` endpoint with Scrapling primary, Firecrawl fallback
- add tests for schema, timeout, retries

### Phase P1

- add crawl queue and per-domain limiter
- add provenance fields to downstream data records

### Phase P2

- add optional patchright/camoufox lab adapters behind feature flag
- keep disabled in production by default

## 9) Test checklist (must pass)

- Unit:
  - schema validation, retry decisions, compliance checks.
- Integration:
  - Scrapling success path, Firecrawl fallback path, timeout path.
- Security:
  - SSRF blocked, private IP blocked, robots policy path.
- Performance:
  - 100 requests mixed, p95 latency and error rate thresholds.
- Verification:
  - run full project verify flow after changes.

