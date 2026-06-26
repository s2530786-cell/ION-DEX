## ION DEX Engineering Task - For Claude via API

### Project: D:\openclaw-tools\ion-dex-nuke

### What's Already Done
1. All 39 Go files have had their import paths fixed (github.com/your-project/pkg/ion/* → github.com/ion-dex-nuke/backend/*)
2. All 29 Go files have had their package names fixed to match directory names
3. go.mod initialized at D:\openclaw-tools\ion-dex-nuke\backend\go.mod with module github.com/ion-dex-nuke/backend
4. go mod tidy was run but got SIGKILL due to go-ethereum being huge (600MB+ download)

### What Needs To Be Done

#### P0: Go Backend - Make it compile
- Fix the `router/adapter_test.go` file: it imports `github.com/ion-dex-nuke/backend/router/sources` which doesn't exist. Either create the sources sub-package or remove the import and fix the test.
- Finish `go mod tidy` — it keeps getting killed because go-ethereum is huge. Try with GOPROXY=direct or use a mirror.
- Run `go build ./...` to verify everything compiles.
- If go-ethereum download keeps failing, consider using a lighter Ethereum library or removing the ethclient dependency from files that don't need it.

#### P0: Frontend - Create build config
- Create package.json with all dependencies (react, react-dom, typescript, vite, tailwindcss, @vitejs/plugin-react, ethers, zustand, react-router-dom, @tanstack/react-query, wagmi, viem, etc.)
- Create tsconfig.json
- Create vite.config.ts
- Create tailwind.config.js
- Fix any broken imports between TS/TSX files
- Run npm install and npm run build

#### P1: FunC Contracts
- Set up Blueprint project structure for contracts/
- Configure stdlib paths

#### P1: Proto
- Create buf.yaml or protoc config
- Generate Go stubs

#### P2: Docker
- Create docker-compose.yml

### Rules
- NEVER create mocks or placeholders
- Short code preferred: files ≤300 lines for components, ≤200 lines for utils
- Write then verify — don't report done without evidence
- Use proxy: HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890
- The 439 UI design HTML files in ui-designs/stitch-screens/ are REFERENCE ONLY — do not modify them

### Key Files to Read First
- D:\openclaw-tools\ion-dex-nuke\backend\go.mod (existing)
- D:\openclaw-tools\ion-dex-nuke\backend\router\adapter_test.go (has broken import)
- D:\openclaw-tools\ion-dex-nuke\backend\cmd\main.go (entry point)
- D:\openclaw-tools\ion-dex-nuke\frontend\src\ (all TS/TSX files)

### Success Criteria
1. go build ./... passes in backend/
2. npm run build passes in frontend/
3. All imports resolve correctly
