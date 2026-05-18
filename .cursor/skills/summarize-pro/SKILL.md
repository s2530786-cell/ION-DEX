---
name: summarize-pro
description: Produces concise, structured summaries of long documents, logs, transcripts, diffs, research results, or verification output. Use when the user asks for a summary, status, digest, extraction of key points, or when long command output must be condensed.
---

# Summarize Pro

Use this skill to compress large context into high-signal summaries without losing decisions, evidence, or risks.

## Summary Rules

- Lead with outcome and current status.
- Preserve exact commands, exit codes, commit hashes, file paths, and verification results.
- Separate facts from interpretation.
- Highlight blockers, risks, and next actions.
- Keep Chinese output by default for ION DEX.
- Do not hide failures or partial verification.

## Formats

For engineering status:

```markdown
## 状态
- ...

## 证据
- ...

## 风险
- ...

## 下一步
- ...
```

For logs:

- command
- exit code
- first failure point
- root cause
- fix recommendation
