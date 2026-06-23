# ION DEX Visual Acceptance Workflow Plan

## Purpose

This work plan turns Master's visual signoff requirement into an executable workflow:

- compare live UI against the designated reference images
- capture real screenshots at required breakpoints
- record gap analysis in a standard template
- automate the capture + reference copy + evidence output path
- make visual acceptance part of recurring agent workflow, not a one-off manual memory exercise

## Governing references

Must-read before visual work:

1. `.memory-bank/ui-cyber-glass-iron-law.md`
2. `.memory-bank/ui-design-master-template.md`
3. `docs/10-ui-design-route.md`
4. `.memory-bank/design-refs/README.md`
5. `docs/ui-round2-visual-alignment.md`

Primary acceptance assets:

- Dashboard master: `.memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png`
- Glass border master: `.memory-bank/design-refs/screens/01-glass-panel-wave-border.png`
- Mobile tile master: `.memory-bank/design-refs/screens/02-mobile-feature-grid-dfi-dex.png`
- Boot masters: `.memory-bank/design-refs/boot/boot-master-square-landscape.mp4`, `.memory-bank/design-refs/boot/boot-master-portrait.mp4`

## Required evidence grades

Visual work must report one of these grades explicitly:

1. `DOM/text confirmed`
2. `behavior confirmed`
3. `visual signoff confirmed`

Do not collapse 1 or 2 into 3.

## Default workflow loop

### Phase 0 — plan the target

For each visual task, create a work item with:

- target surface
- reference asset(s)
- breakpoints: `375`, `768`, `1440`
- acceptance anchors:
  - layout hierarchy
  - glow/border treatment
  - background identity
  - feature-tile identity
  - startup/splash dominance when applicable

### Phase 1 — capture live evidence

Run real screenshot capture against the live repo.

Dashboard baseline:

```bash
node scripts/capture-ui-signoff-screenshots.mjs --batch B
```

This must produce:

- `docs/screenshots/ui-signoff/batch-<x>/dashboard-375.png`
- `docs/screenshots/ui-signoff/batch-<x>/dashboard-768.png`
- `docs/screenshots/ui-signoff/batch-<x>/dashboard-1440.png`

### Phase 2 — compare against references

For each target surface:

- open the designated reference PNG/MP4
- inspect the captured screenshot(s)
- fill the gap-analysis table using `P0 / P1 / P2`
- record the root-cause class:
  - A color/token
  - B glass/blur
  - C border/wave form
  - D layout proportion
  - E motion/background identity
  - F asset/icon/material mismatch

### Phase 3 — implement only one bounded batch

Apply one small, named batch at a time:

- `A` shared primitive
- `B` dashboard visual alignment
- `C` modal/surface refinement
- `SPLASH` startup/boot sequence refinement

### Phase 4 — rerun verification

Minimum verification after each batch:

```bash
cd frontend
npm run build
node scripts/verify-e2e.mjs
```

For dashboard signoff batch also rerun:

```bash
node ../scripts/capture-ui-signoff-screenshots.mjs --batch <name>
```

### Phase 5 — signoff decision

A batch is only visually acceptable when:

- build passes
- targeted Playwright flow passes
- fresh screenshots exist at 375 / 768 / 1440
- updated gap analysis has `P0 = 0`
- final report states whether signoff is:
  - not fixed
  - partially fixed / visually improved
  - visually signoff confirmed

## Automated workflow additions

### 1. Screenshot capture automation

Use `scripts/capture-ui-signoff-screenshots.mjs` as the screenshot producer.

### 2. Evidence package automation

Use `scripts/visual-acceptance-workflow.mjs` to:

- select reference assets for a named surface
- run signoff screenshot capture
- copy reference + captured files into a timestamped evidence folder
- emit a markdown checklist template for the current run

### 3. Agent workflow integration

Visual tasks should use this execution order:

```bash
node scripts/agent-workflow.mjs
node scripts/visual-acceptance-workflow.mjs --surface dashboard --batch B --execute
```

## Surface map

### dashboard
- references:
  - `04-dashboard-galaxy-spiral.png`
  - `01-glass-panel-wave-border.png`
  - `02-mobile-feature-grid-dfi-dex.png`
- captures:
  - `dashboard-375.png`
  - `dashboard-768.png`
  - `dashboard-1440.png`

### splash
- references:
  - `boot-master-square-landscape.mp4`
  - `boot-master-portrait.mp4`
  - `ion-dex-brand-logo.png`
- required proof:
  - DOM/text confirmed
  - auto-exit behavior confirmed
  - screenshot-visible dominance confirmed

## Reporting shape

Every visual delivery report must use:

1. Fixed
2. Not fixed
3. Unverified or blocked
4. Next highest-value action

## Current truthful baseline

As of this plan:

- screenshot capture automation exists for dashboard
- a dashboard visual signoff spec exists
- gap analysis exists for Batch B
- there is not yet a unified automated workflow that packages reference assets + fresh captures + checklist output in one command
- there is not yet an automated splash-specific visual acceptance pipeline equivalent to the dashboard one
