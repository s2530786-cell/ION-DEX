# Reference Architecture And External Patterns

This document maps selected external repositories to ION DEX architecture decisions. It is a reference index, not a vendoring plan. Do not copy code or add dependencies from these repositories without a separate license, security, and maintenance review.

## Adoption Rules

- Use external repositories as pattern references first: architecture, module boundaries, testing strategy, UI ideas, or risk controls.
- Do not vendor large frameworks into ION DEX unless the project has a clear operational owner and verification plan.
- Prefer small local abstractions that match the current Vite/React codebase and future backend boundary.
- Keep all financial, wallet, bridge, fee, treasury, and AI-sentinel flows deterministic, auditable, and user-confirmed.
- Any backend, contract, or AI-agent implementation must include typed interfaces, test plans, and observability hooks before it is accepted.

## Reference Pool

| Area | References | Use In ION DEX | Adoption Level |
|---|---|---|---|
| Backend design | `TykTechnologies/tyk`, `apache/shenyu`, `ThreeMammals/Ocelot` | API gateway, plugin pipeline, routing, auth, rate limits, observability | Pattern reference |
| AI video | `coleam00/hyperframes-ai-video-generation`, `ali-vilab/TeaCache`, `ali-vilab/UniAnimate` | Future marketing studio, tutorials, community explainers | Later phase reference |
| AI image | `markfulton/NanoBananaEditor`, `Amery2010/peinture`, `ImgEdify/Awesome-GPT4o-Image-Prompts` | Future avatar, campaign image, content tooling, prompt library | Later phase reference |
| Advanced web design | `smaranjitghose/awesome-portfolio-websites`, `bedimcode/responsive-portfolio-website-Alexa`, `said7388/developer-portfolio` | Profile, Transparency, Status, landing polish, responsive sections | UI inspiration only |
| Blockchain development | `tact-lang/tact`, `ton-community/twa-template`, `gobicycle/bicycle` | Tact/TON-style contracts, wallet app patterns, DEX mechanics | Pattern reference with ION official source priority |
| AI Agent development | `HKUDS/AutoAgent`, `OpenBMB/XAgent`, `WooooDyy/LLM-Agent-Paper-List` | AI Sentinel, tool orchestration, explanation chain, audit logs | Pattern reference |

## Phase 3 Backend Foundation

The backend should start as a narrow API gateway / BFF layer rather than a full gateway product. The goal is to give the frontend typed, observable, cache-aware data APIs while contracts and indexers evolve.

### Gateway Shape

The gateway should borrow these ideas from Tyk, ShenYu, and Ocelot:

- **Route registry**: each frontend route maps to a service handler with explicit request/response schemas.
- **Middleware pipeline**: validation, rate limit, cache, upstream call, normalization, logging.
- **Plugin slots**: future auth, risk controls, admin gates, and chain-specific adapters can be inserted without rewriting endpoint handlers.
- **Health and status endpoints**: every service exposes freshness, upstream health, and stale-data state.
- **Observability by default**: request ID, source, latency, cache result, upstream status, and data timestamp.

Initial services:

```text
api-gateway
  -> config-service
  -> token-list-service
  -> market-service
  -> burn-service
  -> staking-service
  -> bridge-status-service
  -> domain-service
  -> profile-service
```

### Initial API Surface

| Endpoint | Purpose | Data Source Phase |
|---|---|---|
| `GET /api/health` | Gateway health, version, uptime | Phase 3 |
| `GET /api/config/public` | Public feature flags, chain IDs, supported wallets | Phase 3 |
| `GET /api/tokens` | Token metadata and supported pairs | Phase 3 |
| `GET /api/markets/tickers` | Ticker strip and market cards | Phase 3 mock, later CMC/cache |
| `GET /api/burn/summary` | BSC + ION burn summary with freshness | Phase 3 mock, later indexer |
| `GET /api/staking/summary` | Official, DEX, LP staking totals | Phase 3 mock, later indexer |
| `GET /api/bridge/routes` | Supported bridge routes and status copy | Phase 3 mock, later bridge service |
| `GET /api/domain/resolve?name=` | `.ion` resolver draft contract | Phase 3 mock, later domain service |
| `GET /api/profile/demo` | Wallet/profile shell data | Phase 3 mock, later wallet/session service |

All responses should include:

```json
{
  "data": {},
  "meta": {
    "source": "mock|cache|upstream|indexer",
    "updatedAt": "ISO-8601",
    "stale": false,
    "requestId": "string"
  }
}
```

### Reliability Rules

- Every external source gets timeout, retry budget, and stale-data handling.
- CMC, RPC, indexers, and DNS APIs must never block the whole dashboard.
- Cached market data must expose last-updated time.
- Bridge, burn, staking, treasury, and domain values must label provenance.
- Admin-only endpoints must be separated from public endpoints from day one.
- Secrets live only in environment variables and must not enter Playwright fixtures or docs.

### Suggested Tech Path

Short-term, keep the backend minimal and repository-local:

```text
backend/
  src/
    server.ts
    gateway/
      routes.ts
      middleware.ts
      response.ts
    services/
      config.ts
      tokens.ts
      markets.ts
      burn.ts
      staking.ts
      bridge.ts
      domain.ts
      profile.ts
    lib/
      validation.ts
      cache.ts
      request-id.ts
      clock.ts
  tests/
```

Good first implementation target:

1. Add typed mock API server with health/config/tokens/tickers.
2. Add backend unit/API tests.
3. Wire frontend ticker strip and wallet/profile shell to the API with loading/stale/error states.
4. Preserve offline mock fallback for deterministic Playwright tests.

## Blockchain Reference Usage

ION official source remains the primary authority for ION-native contracts, wallets, DNS, lite-client, tonlib, and FunC patterns.

Use the external blockchain references this way:

- `tact-lang/tact`: learn modern TON/Tact project layout, test structure, message schemas, and deployment patterns.
- `ton-community/twa-template`: reference wallet/web-app interaction patterns and Telegram WebApp style integration.
- `gobicycle/bicycle`: study DEX mechanics, route modeling, pool UX, and risk surfaces. Do not assume direct compatibility with ION.

Before implementing contract code, load `ion-official-source` and `ion-contract-audit` skills, then create separate contract specs and tests.

## AI Agent And Sentinel Usage

AI references are useful for orchestration patterns, but ION DEX must keep AI advisory:

- AI can summarize markets, explain risk, and draft grid ideas.
- AI cannot sign, swap, stake, bridge, burn, or change allowances.
- Every AI output must include source labels, confidence, timestamp, and non-investment-advice copy.
- Tool-calling agents must log prompt, inputs, selected tools, output, and human confirmation state.

Potential future services:

```text
ai-market-service
  -> market-summary
  -> risk-score
  -> whale-monitor
  -> grid-suggestion
  -> prediction-audit-log
```

## Advanced UI And Media Usage

The web design and AI media references are useful after the core product shell is stable:

- Profile center: polished portfolio-style sections for wallets, badges, domains, referrals, and settings.
- Transparency page: public audit, contract, burn, fee, treasury, and system-status sections.
- Marketing studio: AI video/image prompts for launch education, tutorials, and community assets.

Guardrails:

- Do not let marketing or generative-media tooling enter asset movement flows.
- Keep UI inspired by references, but preserve ION DEX's existing neon Web3 visual language.
- Add visual regression only after stable page layouts exist.

## Immediate Next Step

Recommended next implementation milestone:

1. Create a minimal `backend/` API gateway skeleton with typed mock endpoints.
2. Add backend tests for health/config/tokens/tickers.
3. Add docs for environment variables and run commands.
4. Wire one low-risk frontend read path to the backend, preferably ticker strip or public config.
5. Run encoding, backend tests, frontend verify, high audit, and then 100-pass gate for the milestone.
