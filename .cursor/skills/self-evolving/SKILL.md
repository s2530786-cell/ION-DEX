---
name: self-evolving
description: Captures lessons from completed work, failed attempts, verification loops, and user corrections, then proposes safe updates to project memory, docs, rules, or skills. Use after major tasks, repeated failures, or when the user asks the agent to improve itself.
---

# Self Evolving

Use this skill to turn work history into safer future behavior. Do not silently rewrite rules; propose or apply only scoped project-memory updates.

## Process

1. Identify the concrete lesson: failure mode, successful workaround, project convention, or user preference.
2. Decide the right storage location:
   - `SESSION_STATE.md` for session state and next actions.
   - `docs/99-current-progress.md` for progress and verification evidence.
   - `.cursor/skills/*/SKILL.md` for reusable workflow knowledge.
   - `AGENTS.md` for high-level mandatory project behavior.
3. Keep updates short and evidence-based.
4. Do not encode secrets, machine-local credentials, or transient logs.
5. Run encoding verification after writing.

## Guardrails

- Never weaken verification or security to improve speed.
- Do not claim a pattern is proven unless it has command output or repeated evidence.
- Preserve user intent over agent convenience.
- Keep ION DEX responses in Simplified Chinese unless the user asks otherwise.
