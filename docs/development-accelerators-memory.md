# Development Accelerators Memory

Snapshot date: 2026-05-17

This file records development workflows that are useful for ION DEX. Use it when deciding how to speed up development without weakening security or verification.

## High-Value Workflows

### 1. Git Worktrees

Use worktrees when multiple tasks must run in parallel without dirtying the main checkout.

Best uses:

- Isolate experimental Agent work from the stable workspace.
- Let multiple agents work on different branches.
- Keep a clean worktree for long verification runs.
- Handle urgent fixes without stashing current work.
- Compare alternative implementations before choosing one.

Recommended ION DEX layout:

```text
main workspace      stable integration and final verification
worktree-ui         Trade/Grid/frontend UI work
worktree-contracts  FunC/Solidity/security experiments
worktree-backend    API/indexer/data integration work
worktree-verify     long verification and stress-test runs
```

Cursor-specific commands:

- `/worktree <task>` starts an isolated worktree task.
- `/apply-worktree` brings selected changes back.
- `/delete-worktree` cleans up after review.
- `/best-of-n model1,model2,model3 <task>` compares multiple model outputs in isolated worktrees.

Git commands:

```bash
git worktree list
git worktree add -b feature/name ../ion-dex-feature main
git worktree remove ../ion-dex-feature
git worktree prune
```

Rules:

- Do not share dev server ports across worktrees.
- Do not symlink dependency directories between worktrees.
- Prefer package-manager caches over shared `node_modules`.
- Each worktree must pass its own verification before merge.
- Merge back only through reviewable commits or PRs.

### 2. Cursor Worktree Setup

Cursor can configure worktree setup with `.cursor/worktrees.json`.

Useful Windows example for this repository:

```json
{
  "setup-worktree-windows": [
    "cd frontend && npm install",
    "cd frontend && npx playwright install chromium"
  ]
}
```

Use this only after confirming dependency install time and disk usage are acceptable.

### 3. Hooks

Hooks are useful for enforcing repeatable checks around Agent workflows.

Good ION DEX hook candidates:

- Reject UTF-16, BOM, ANSI, or NUL bytes after file writes.
- Block dangerous shell commands.
- Run or remind encoding checks before completion.
- Scan for private keys, seed phrases, `.env`, RPC secrets, and API tokens.
- Record verification evidence.

Do not use hooks as the only safety layer. Keep deterministic scripts.

### 4. Agent Review And Bugbot

Use both:

- Agent Review: local diff review before final verification.
- Bugbot: PR-level review in GitHub/GitLab.

Rules:

- Use `BUGBOT.md` for ION DEX review focus.
- Treat asset movement, fee, oracle, burn, bridge, treasury, wallet, DNS, identity, and sentinel changes as security-sensitive.
- Agent Review and Bugbot do not replace build, tests, audit, or 100-pass gates.

### 5. Cloud Agents

Use Cloud Agents for isolated parallel work and PR creation when local work would block progress.

Requirements:

- Environment must be reproducible.
- Secrets must be configured through the Cloud Agents dashboard, not committed.
- Egress/network access must be explicit.
- The repository must be locally testable.
- Cloud output must include artifacts, logs, screenshots, or test evidence.

ION DEX usage:

- Good for UI alternatives, docs, test generation, or isolated refactors.
- Avoid giving cloud agents production private keys or production deploy credentials.

### 6. Cursor CLI And CI

Use Cursor CLI for repeatable automation and CI experiments.

Useful commands:

```bash
agent
agent -p "review these changes for security issues" --output-format text
agent --mode=plan
agent --mode=ask
agent ls
agent resume
```

In CI, prefer restricted autonomy:

- Agent may modify files.
- CI performs deterministic git commit, push, comments, and deployment steps.
- Use `CURSOR_API_KEY` as a secret.
- Add permissions that deny secrets, `.env`, package manager metadata, or git operations unless explicitly needed.

### 7. MCP Tools

Use MCP when Agent needs the same external tools as human developers.

Good future candidates for ION DEX:

- Explorer/testnet query tools.
- Memory and project knowledge tools.
- Browser/UI verification tools.
- Security scanning tools.
- Price/feed inspection tools.
- Deployment or cloud status tools with read-only permissions.

Rules:

- Review tool permissions before enabling.
- Prefer read-only tools first.
- Use least-privilege credentials.
- Do not connect sensitive production systems casually.

### 8. Rules And Skills

Use Skills for repeated workflows and Rules for repeated behavior constraints.

Current project skills:

- `chinese-language`
- `ion-dex-memory`
- `ion-official-source`
- `ion-web3-ui`
- `ion-contract-audit`
- `ion-data-backend`
- `cursor-engineering-workflow`
- `ion-dev-accelerators`

Add a new Skill only when a workflow will be reused. Add a Rule only when Agent repeatedly needs the same instruction.

### 9. Best-Of-N

Use `/best-of-n` for difficult or ambiguous tasks where several solutions may be valid.

Good cases:

- Complex UI interaction design.
- Grid trading validation architecture.
- Contract invariant modeling.
- Test strategy comparison.
- Performance optimization approaches.

Do not automatically accept the most polished result. Require review, tests, and security checks.

## Standard Decision Tree

Use this when choosing a development accelerator:

```text
Need isolated parallel work? -> worktree
Need multiple solution attempts? -> /best-of-n
Need repeatable safety checks? -> hooks + scripts
Need local diff review? -> /agent-review
Need PR-level review? -> Bugbot
Need cloud isolation or remote PR creation? -> Cloud Agent
Need CI automation? -> Cursor CLI with restricted permissions
Need external systems or memory? -> MCP
Need reusable process knowledge? -> Skill
Need persistent behavioral constraint? -> Rule or AGENTS.md
```

## ION DEX Safety Baseline

No accelerator bypasses the core gate:

1. Keep files UTF-8 without BOM.
2. Keep changes scoped and reviewable.
3. Run Agent Review for meaningful diffs.
4. Run encoding, build, Playwright, and audit.
5. Run 100-pass verification for completed feature milestones.
6. Update project memory and progress docs.
