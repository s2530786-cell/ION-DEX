# Deprecated GNU make / CustomMakeBuilder artifacts

These files supported SAM `Metadata.BuildMethod: makefile` on Windows before Phase 1 switched to **`Metadata.BuildMethod: nodejs22.x`**.

## Do not use for new builds

Use instead:

```powershell
cd backend
npm run sam:build:win
```

That runs `npm run build` + `sam build -t serverless/template.yaml` with the managed Node.js 22 builder (no GNU make, no Docker required on Windows).

## Contents (archived)

| File | Former role |
|------|-------------|
| `Makefile` | SAM makefile target: `build-IonDexApiGatewayFunction` |
| `make.cmd` / `make.bat` | Windows shim when SAM invoked `make` |
| `serverless/Makefile` | Pointer doc only |
| `scripts/sam-prepare-artifacts.mjs` | Copy `dist/` into `.aws-sam/build/...` |
| `scripts/sam-build-artifacts.mjs` | Node entry used by `make.cmd` |
| `scripts/sam-build-artifacts.ps1` | PowerShell variant |
| `scripts/sam-build-win.ps1` | Fallback build script (make → container) |

Removed from active tree on 2026-05-29. Kept here for reference if you need to compare old vs new packaging.
