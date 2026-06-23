---
name: find-skill
description: Finds, lists, and inspects available Cursor Agent Skills in project and user skill directories. Use when the user asks what skills exist, wants a skill installed, wants to locate a workflow, or when the agent needs to choose the right skill before acting.
---

# Find Skill

Use this skill to discover installed Skills before creating duplicates or claiming a capability is missing.

## Search Locations

- Project skills: `.cursor/skills/*/SKILL.md`
- User skills: `C:\Users\admin\.cursor\skills\*/SKILL.md`
- Cursor built-in skills: `C:\Users\admin\.cursor\skills-cursor\*/SKILL.md` (read-only, never edit)

## Workflow

1. List matching `SKILL.md` files.
2. Read candidate frontmatter and first instructions.
3. Select the narrowest relevant skill.
4. If a requested skill is missing, create a project-local Skill only when the user asks to install or author it.
5. Avoid editing built-in `skills-cursor`.

## Output

Report:

- skill name
- path
- trigger/purpose
- whether it is project, user, or built-in
- any gaps before use
