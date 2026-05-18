---
name: luke-agent-browser-clawdbot
description: Guides browser automation for webapp verification, UI smoke tests, screenshots, and page interaction debugging. Use when navigating the app in a browser, validating frontend changes, reproducing UI bugs, or automating multi-step browser workflows.
---

# Luke Agent Browser Clawdbot

Use this skill for browser-based verification. Prefer deterministic Playwright tests for gates; use interactive browser automation for evidence, debugging, and visual inspection.

## Browser Workflow

1. Inspect existing browser tabs before acting.
2. Navigate directly to the target URL when known.
3. Take a fresh page snapshot before interactions.
4. Interact using stable selectors or accessibility roles.
5. After every navigation or state-changing action, take a fresh snapshot.
6. Capture screenshots when visual layout, responsive behavior, or regressions matter.
7. Stop and report blockers such as login, missing credentials, captcha, destructive confirmation, or unexpected state.

## ION DEX Usage

- Use `npm run dev:local` for local frontend inspection on `http://127.0.0.1:3001/`.
- Use Playwright smoke tests for merge gates.
- Validate 375px, 768px, and desktop viewports for UI changes.
- Never enter private keys, seed phrases, production wallet credentials, or real signing prompts.
