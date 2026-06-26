## Task: Ion Dex Nuke Engineeringization

You have 234 source files from a Stitch export that need to be turned into a compilable, deployable monorepo. All code is real and complete — no mocks. The quality is good. But the engineering glue (module paths, build configs, dependency declarations) is missing.

## Project Location
D:\openclaw-tools\ion-dex-nuke

## Current State
- **39 Go files** in backend/ (18 subdirectories: ai/, api/, cmd/, execution/, gas/, indexer/, infrastructure/, ionflow/, oracle/, plugin/, protocol/, registry/, router/, security/, simulation/, sniper/, vault/, worker/)
- **3 FunC contracts** in contracts/func/ (safety.fc, vault_settlement.fc, ion_factory.fc)
- **116 TS/TSX/Vue files** in frontend/src/ (components, hooks, sdk, lib, types, stores, styles, pages, views, workers, i18n, config, wallet)
- **3 Proto files** in proto/
- **3 SQL migrations** in database/migrations/
- **439 UI design HTML files** in ui-designs/stitch-screens/ (reference only, don't modify)
- **Existing scripts/** and **docker/** directories

## What Needs To Be Done

### 1. Go Backend (P0 - Critical)
- Create `go.mod` with module `github.com/ion-dex-nuke/backend`
- Fix ALL import paths throughout 39 Go files. Current paths use `github.com/your-project/pkg/ion/...` — replace with correct module paths
- Resolve cross-file package naming. Some files have inconsistent package names (e.g., `package intelligence` for ai files, `package core` for protocol files) — make them consistent OR create proper sub-packages
- Identify all external dependencies (redis, gRPC, etc.) and add to go.mod
- Run `go mod tidy` to verify
- Run `go build ./...` to verify compilation

### 2. Frontend (P0 - Critical)  
- Create `package.json` with all dependencies
- Create `tsconfig.json`
- Create `vite.config.ts` (or next.config.js)
- Create `tailwind.config.js` (the UI uses Tailwind heavily)
- Fix any broken imports between TS/TSX files
- Run `npm install` and `npm run build` to verify

### 3. FunC Contracts (P1 - Important)
- Set up Blueprint project structure for contracts/
- Configure stdlib paths (currently `#include "stdlib.fc"` and `#include "imports/stdlib.fc"`)
- Verify `func -PA` compilation

### 4. Proto (P1 - Important)
- Create buf.yaml or protoc config
- Generate Go stubs from the 3 proto files

### 5. Database (P1 - Important)
- Create a migration runner (simple Node.js or Go script)
- Fix any SQL syntax issues

### 6. Docker (P2)
- Create/update docker-compose.yml with: Go API, Redis, PostgreSQL, Frontend dev server

### 7. Placeholder Values (P2)
- Replace hardcoded fake addresses (`0x1111...`, `0x2222...`) with config/env vars
- Add Redis connection config via env vars

## Rules
- NEVER create mocks or placeholders (铁律16)
- Short code preferred (铁律19): files ≤300 lines for components, ≤200 lines for utils
- Write then verify — don't report done without evidence
- Use the proxy: HTTP_PROXY=http://127.0.0.1:7890, HTTPS_PROXY=http://127.0.0.1:7890
- The 439 UI design HTML files are REFERENCE ONLY — do not modify them

## Success Criteria
1. `go build ./...` passes in backend/
2. `npm run build` passes in frontend/
3. All Go imports resolve correctly
4. docker-compose.yml starts all services
5. FunC contracts compile with func

Start with P0 items (Go backend + Frontend) and work down. Report progress at each major milestone.
