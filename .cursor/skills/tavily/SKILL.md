---
name: tavily
description: Performs AI-oriented web search and source gathering. Use when the user asks to search the web, compare current technologies, research repositories, find documentation, or gather external references. If Tavily MCP/API is unavailable, use the best available web/search tool and clearly state the fallback.
---

# Tavily Search

Use this skill for current external research. Tavily is preferred when configured; otherwise use available web or MCP search tools.

## Search Workflow

1. Define the research question and required freshness.
2. Prefer authoritative sources: official docs, repository README, release notes, security advisories.
3. Gather multiple sources for architectural or security decisions.
4. Summarize facts with source names and URLs when web tools provide them.
5. Separate facts from recommendations.

## ION DEX Rules

- Do not install dependencies from search results without license and security review.
- Treat third-party code as reference until explicitly approved.
- For blockchain, wallet, bridge, fee, treasury, or AI Sentinel topics, prefer official ION source and project docs first.
- If no Tavily tool/API is configured, say so and use the available search fallback.
