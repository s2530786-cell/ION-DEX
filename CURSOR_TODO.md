# CURSOR TODO — Auto-generated 2026-05-22T04:16:36.530Z

**Branch:** cursor/ui-design-workflow-44c9  
**Last commit:** 7c8bde66 pipeline: cursor-sync + audit + deploy (2026-05-22 12:13)  
**Changed files:** none

## Priority Tasks

### 🔴 P0 — Blocking
- [ ] Run audit: `node skills/ion-dex-commander/scripts/audit-local-code.mjs`
- [ ] Fix all FAIL-level issues from audit
- [ ] Verify glass/3D standards in ion-glass-3d-mandate.mdc

### 🟡 P1 — Important
- [ ] Ensure all API calls use live data (no mocks)
- [ ] Check UTF-8 encoding on all modified files
- [ ] Verify no files exceed 300 lines

### 🟢 P2 — Polish
- [ ] Review neon rim colors match brand standard (#24f7ff/#ff3bd4)
- [ ] Check mobile responsiveness on all changed components
- [ ] Run build and fix any type errors

## Recent Commits
```
7c8bde66 pipeline: cursor-sync + audit + deploy (2026-05-22 12:13)
c8cbe89a fix: remove all 3D transforms + wobbling — flat glass only
e0bd7ed3 fix: remove stray floating logo + brand emblem from Swap + float-3d toggle
fee722b3 fix: disable float-3d animation + remove giant brand emblem from SwapPanel
ca076491 docs: update glass mandate — add rule 0: no 3D float animation
d28acb05 fix(ui): disable 3D float animation — static glass only
52ae6b61 pipeline: cursor-sync + audit + deploy (2026-05-22 11:53)
f77852b0 feat(ui): hero rim + brighter aurora + iON brand neon colors
adbbf66a fix: transparent glass + dramatic 3D float — aurora visible through cards
aadbbda3 chore: CSS import order + NUL gitignore + backend test-mock start script
```

## Auto-Deploy
Run: `node skills/ion-dex-commander/scripts/git-auto-deploy.mjs`
