# Cursor Docs Feature Memory

Snapshot date: 2026-05-17
Source: `https://cursor.com/cn/docs` and `https://cursor.com/llms.txt`

This file is the project-local memory of Cursor's official documentation. Use it as the first reference when configuring Cursor workflows for ION DEX.

## Core Product Areas

### Agent

Cursor Agent is the main autonomous coding assistant. It can search code, read files, edit files, run shell commands, use browser control, search the web, generate images, and ask clarifying questions.

Important entry points:

- Desktop: open Agent with `Cmd+I` / `Ctrl+I`.
- Agent mode: full tool access for coding tasks.
- Plan mode: design an implementation before editing.
- Ask mode: read-only exploration.
- `/agent-review`: run local Agent Review on the current diff.

Key concepts:

- Agent behavior is shaped by instructions, tools, and selected model.
- Tool calls are not limited to a fixed count in one task.
- Checkpoints are local snapshots created before major changes.
- Queued messages let the user line up instructions while Agent is still working.
- Use browser tools to validate UI changes with screenshots and page interactions.
- Use Debug mode for systematic troubleshooting.

ION DEX usage:

- Use Agent mode for scoped implementation after planning.
- Use Plan mode for architecture, contracts, bridge design, auth, treasury, or data pipelines.
- Use Ask mode for read-only codebase exploration.
- Use `/agent-review` after meaningful diffs and before final verification.

### Agent Review

Agent Review is a specialized local code review flow for the current diff. It can be triggered manually with `/agent-review`, automatically after Agent tasks, or from the Source Control panel.

Review depth:

- Fast: smaller diffs and lower cost.
- Deep: complex logic, security-sensitive paths, or bigger changes.

ION DEX usage:

- Treat it as a review gate, not a replacement for tests.
- Project rules live in `BUGBOT.md`.
- Run it for smart contracts, swap/trade/grid flows, bridge, staking, burn, treasury, wallet, identity, and security sentinel changes.

### Rules

Rules provide persistent instructions to Agent. Cursor supports:

- Project rules in `.cursor/rules`.
- User rules in Cursor settings.
- Team rules from the Cursor dashboard.
- `AGENTS.md` as a simple project instruction file.

Project rules can be:

- Always Apply.
- Apply Intelligently by `description`.
- Apply to Specific Files by `globs`.
- Apply Manually by `@rule-name`.

Best practices:

- Keep rules focused and under 500 lines.
- Prefer examples and file references over copied code.
- Do not duplicate what linters and tests already enforce.
- Add rules only when the Agent repeatedly makes the same mistake.

ION DEX usage:

- Keep `AGENTS.md` as the top-level instruction file.
- Use project skills and `BUGBOT.md` for domain-specific behavior.
- Add `.cursor/rules` only for repeated narrow patterns, such as contract migration style or frontend test conventions.

### Skills

Skills are reusable instruction packages for specialized workflows. They are useful for domain playbooks that must be loaded before working.

ION DEX usage:

- Existing project skills:
  - `.cursor/skills/chinese-language/SKILL.md`
  - `.cursor/skills/ion-dex-memory/SKILL.md`
  - `.cursor/skills/ion-official-source/SKILL.md`
  - `.cursor/skills/ion-web3-ui/SKILL.md`
  - `.cursor/skills/ion-contract-audit/SKILL.md`
  - `.cursor/skills/ion-data-backend/SKILL.md`
- Add future skills only when a workflow is repeated enough to justify it.

### MCP

MCP connects Cursor to external tools and data sources.

Supported transports:

- `stdio`: local server managed by Cursor.
- `SSE`: local or remote server endpoint.
- `Streamable HTTP`: local or remote HTTP endpoint.

Supported capabilities:

- Tools.
- Prompts.
- Resources.
- Roots.
- Elicitation.
- MCP Apps with interactive UI.

Configuration locations:

- Project: `.cursor/mcp.json`.
- Global: `~/.cursor/mcp.json`.

Security rules:

- Install only trusted MCP servers.
- Use environment variables for secrets.
- Use least-privilege API keys.
- Review MCP source code before connecting sensitive systems.
- Prefer local `stdio` for sensitive data.

ION DEX usage:

- Keep Memory Bank MCP for persistent project memory.
- Keep Desktop Commander or equivalent command execution tools available as a fallback.
- Add blockchain, explorer, testnet, pricing, or security-analysis MCPs only after reviewing permissions.

### Hooks

Hooks let custom scripts observe and control Agent loops through JSON communication. They can support formatting, analytics, PII scanning, policy checks, or command gating.

ION DEX usage:

- Good candidates:
  - Encoding check after file writes.
  - Reject UTF-16, BOM, or NUL bytes.
  - Block unsafe commands.
  - Require verification scripts before completion.
  - Scan for secrets before commit.

### Subagents

Subagents are specialized agents for delegated work. They are useful when parallelizing exploration, review, testing, or domain-specific analysis.

ION DEX usage:

- Use read-only exploration subagents for broad codebase mapping.
- Use review-oriented agents for contracts, backend, UI, and security.
- Do not use subagents as a substitute for deterministic tests.

### Inline Edit

Inline Edit is a quick targeted editing mode, usually launched with `Cmd+K` / `Ctrl+K`.

ION DEX usage:

- Use it for small, local changes.
- Do not use it for architecture changes, contract changes, or multi-file features without Agent Review and tests.

### Tab / Autocomplete

Cursor Tab provides inline code completion. It is separate from Agent rules; project rules do not necessarily affect Tab behavior.

ION DEX usage:

- Treat Tab output as a draft.
- Review all generated code in security-sensitive paths.

### Cloud Agents

Cloud Agents run in isolated cloud environments instead of the local machine. They can run in parallel, build and test code, use remote desktop/browser control, use configured MCP servers, and create PRs.

Entry points:

- `cursor.com/agents`.
- Desktop Agent dropdown set to Cloud.
- Slack `@cursor`.
- GitHub PR or issue comments with `@cursor`.
- Linear `@cursor`.
- API.

Environment setup:

- GitHub or GitLab connection is required.
- Environments can be configured with snapshots or `.cursor/environment.json`.
- Secrets are managed in the Cloud Agents dashboard.

ION DEX usage:

- Use Cloud Agents for isolated experiments or parallel PRs.
- Require the same verification gate as local work.
- Do not put private keys or production secrets in snapshots.

### Bugbot

Bugbot reviews PRs and identifies bugs, security issues, and code quality problems. It can run automatically on PR updates or manually with comments:

- `cursor review`
- `bugbot run`

Bugbot can:

- Read PR diff and existing PR comments.
- Leave review comments with fix suggestions.
- Publish a `Cursor Bugbot` check.
- Use team, repository, and project rules.
- Learn rules from PR activity or `@cursor remember [fact]`.
- Start Cloud Agent Autofix when enabled.

Project rules:

- Official docs describe `.cursor/BUGBOT.md`.
- This project currently also keeps root `BUGBOT.md` for Agent Review context.

ION DEX usage:

- Use Bugbot for PR-level review.
- Make security-sensitive findings blocking when possible.
- Use `BUGBOT.md` to emphasize asset movement, contracts, bridge, burn, oracle, fee, and treasury risks.

### Cursor CLI

Cursor CLI exposes Agent from the terminal.

Install:

```powershell
irm 'https://cursor.com/install?win32=true' | iex
```

Basic usage:

```bash
agent
agent "refactor auth module"
agent -p "review these changes for security issues" --output-format text
agent ls
agent resume
agent --continue
```

Modes:

- Agent: full tool access.
- Plan: `/plan`, `--plan`, or `--mode=plan`.
- Ask: `/ask` or `--mode=ask`.

Cloud handoff:

```bash
& refactor the auth module and add comprehensive tests
```

ION DEX usage:

- Use CLI for repeatable local automation and CI experiments.
- Use headless mode or GitHub Actions only with explicit permissions and API keys stored as secrets.

### Cursor SDK

Cursor SDK lets external TypeScript/Node.js code run Cursor agents programmatically. It supports local, cloud, and self-hosted runtime patterns.

ION DEX usage:

- Consider SDK only after the local verification loop is stable.
- Good future use: automated review bots, release gates, test-fix loops, or PR triage workflows.

### GitHub / GitLab / Linear / Slack / Teams Integrations

Cursor integrates with:

- GitHub and GitLab for PRs, issues, Bugbot, and Cloud Agents.
- Slack and Microsoft Teams for launching agents and notifications.
- Linear for issue-driven agent work.
- JetBrains and Xcode integrations for non-VS Code workflows.
- Deeplinks for opening Cursor resources directly.

ION DEX usage:

- Prefer GitHub PR integration plus Bugbot when the repo is ready for PR workflow.
- Use Slack/Linear only after team workflow is established.

### Models And Pricing

Cursor supports models from OpenAI, Anthropic, Google, xAI, Moonshot, and Cursor's own Composer models.

Usage pools:

- Auto + Composer: lower-cost everyday agentic coding.
- API pool: model-specific API rates.

Modes:

- Auto chooses a balanced model.
- Premium routes to stronger models for complex tasks.
- Max mode expands context windows and costs more.

ION DEX usage:

- Use Auto or Composer for routine UI/docs edits.
- Use stronger reasoning models or Max mode for contracts, bridge, security, or large refactors.
- Monitor usage during 100-pass or agentic automation loops.

### Security And Privacy

Cursor Agent has built-in controls because AI can be affected by prompt injection and hallucination.

Defaults:

- File read/search generally do not require approval.
- Workspace file edits can be applied by Agent.
- Terminal commands require approval by default.
- MCP tool calls require approval unless allowlisted.
- Arbitrary network requests are restricted.
- Use `.cursorignore` to hide sensitive files.

Important warnings:

- Do not use broad "Run Everything" approval for sensitive projects.
- Allow lists are best-effort, not hard security guarantees.
- Use version control for rollback.
- Enable workspace trust for untrusted repositories if needed.

ION DEX usage:

- Never expose private keys, seed phrases, RPC secrets, deployer keys, or production API tokens.
- Keep terminal and MCP approvals strict.
- Use least-privilege service accounts.
- Add hooks or scripts for secret scanning before commits.

### Teams And Enterprise

Teams features include:

- Enforced privacy mode.
- Admin dashboard and usage analytics.
- Central billing.
- SAML/OIDC SSO.

Enterprise adds:

- Advanced identity and access management.
- SCIM, RBAC, MDM policies.
- Privacy and data governance controls.
- Network configuration.
- LLM safety and controls.
- Model and integration management.
- Pooled usage, audit logging, compliance monitoring.
- Service accounts and billing groups.
- HIPAA BAA support.

ION DEX usage:

- For production team work, require privacy mode, SSO, audit logging, and controlled MCP integrations.
- Use service accounts for CI/automation, never personal API keys.

### Troubleshooting

Common areas:

- Agent issues.
- Tab issues.
- Install issues.
- Network/proxy issues.
- Extension issues.
- Performance issues.
- Bug reporting.

Network notes:

- Use Cursor network diagnostics from Settings.
- Corporate proxies may block HTTP/2; use HTTP/1.1 compatibility when needed.
- VPN DNS issues may require a full Cursor restart.
- Required domains include Cursor API/CDN domains.

ION DEX usage:

- If shell stdout is unreliable, continue the log-file verification pattern.
- If MCP tools fail, inspect MCP logs before assuming the workflow is blocked.

## Official Sitemap Categories To Remember

The official docs sitemap includes:

- Get Started: quickstart, models, pricing, changelog.
- Agent: overview, agents window, Agent Review, Plan mode, prompting, Debug mode, terminal, browser, search, canvas, worktrees, security.
- Customizing: plugins, rules, skills, subagents, hooks, MCP.
- Cloud Agents: setup, capabilities, machines, self-hosted pools, Cloud Run, automations, best practices, security, network, settings, API endpoints.
- Bugbot.
- Integrations: Slack, Microsoft Teams, Linear, GitHub, GitLab, JetBrains, Xcode, deeplinks.
- SDK: TypeScript SDK.
- CLI: overview, installation, using, shell mode, ACP, headless, GitHub Actions, slash commands, parameters, authentication, permissions, configuration, output format, terminal setup.
- Account: Teams setup, pricing, members, SSO, dashboard, analytics.
- Enterprise: IAM, SCIM, privacy/data governance, network configuration, LLM safety, model/integration management, pooled usage, compliance, BAA, deployment patterns, service accounts, billing groups, Cursor Blame.
- Help Center: getting started, AI features, customization, models and usage, security and privacy, account and billing, integrations, troubleshooting, internationalization.

## ION DEX Operating Standard

For this project, Cursor capabilities should be used in this order:

1. Read `AGENTS.md`, `SESSION_STATE.md`, and relevant project skills.
2. Use Ask/Plan mode for exploration and high-risk design.
3. Implement in small slices with Agent mode.
4. Run `/agent-review` for meaningful diffs.
5. Run deterministic verification: encoding, build, E2E, audit.
6. For completed feature milestones, run the 100-pass verification gate.
7. Update progress docs and memory.

This document is a memory aid, not a substitute for live official docs. When exact CLI flags, pricing, security terms, or API parameters matter, re-check the corresponding official page.
