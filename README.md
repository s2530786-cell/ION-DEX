# CHANGELOG Generator

**Bounty**: $50 — [claude-builders-bounty #1](https://github.com/claude-builders-bounty/claude-builders-bounty/issues/1)

Auto-generates a structured `CHANGELOG.md` from git history. Commits are categorized into **Added**, **Fixed**, **Changed**, and **Removed** sections based on commit message prefixes.

## Setup

```bash
chmod +x generate-changelog.sh
```

## Usage

```bash
# Since last git tag
./generate-changelog.sh

# Since specific tag
./generate-changelog.sh v1.0.0

# Between two refs
./generate-changelog.sh v1.0.0 v1.1.0
```

## Categorization Rules

| Prefix | Category |
|--------|----------|
| `feat:` / `add:` / `new:` / `implement:` | **Added** |
| `fix:` / `bug:` / `patch:` / `resolve:` | **Fixed** |
| `remove:` / `delete:` / `drop:` / `deprecate:` | **Removed** |
| Everything else | **Changed** |

## Sample Output

```markdown
# Changelog

## [2026-05-20] — v1.0.0 → HEAD

### Added
- feat: add ION domain resolution (abc1234)
- new: implement bridge decimals conversion (def5678)

### Fixed
- fix: sandwich attack vector in pool (ghi9012)
- bug: edge case in slippage calculation (jkl3456)

### Changed
- update README with ION ecosystem features (mno7890)
```
