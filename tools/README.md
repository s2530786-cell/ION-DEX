# ION DEX — local agent tooling

## `mcp-e2b-quickstart/`

E2B sandbox MCP quickstart (TypeScript). Copy `.env.example` to `.env` and set API keys locally — never commit `.env`.

## Compose for Agents (local clones, not in git)

Large upstream demos live under:

- `compose-for-agents/` — official [docker/compose-for-agents](https://github.com/docker/compose-for-agents) clone (has its own `.git`)
- `compose-for-agents-external/` — optional external samples (nested `.git` per project)

These directories are **gitignored** to avoid embedded repositories in the main tree. Install with:

```powershell
& scripts\setup-compose-for-agents.ps1
```

See `docs/compose-for-agents-setup.md` and `docs/docker-mcp-gateway-local.md`.
