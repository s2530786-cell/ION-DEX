/**
 * E2B + Docker MCP Catalog quickstart (Notion + GitHub).
 * Docs: https://docs.docker.com/ai/mcp-catalog-and-toolkit/e2b-sandboxes/
 *
 * Usage:
 *   cp .env.example .env   # fill credentials
 *   npm install
 *   npm start            # connect test only
 *   npm run workflow     # Notion search + GitHub issue demo
 */
import "dotenv/config";
import { Sandbox } from "e2b";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Missing ${name} in .env`);
  }
  return v.trim();
}

async function createMcpSandbox(): Promise<Sandbox> {
  return Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    envs: {
      ANTHROPIC_API_KEY: requireEnv("ANTHROPIC_API_KEY"),
    },
    mcp: {
      notion: {
        internalIntegrationToken: requireEnv("NOTION_INTEGRATION_TOKEN"),
      },
      githubOfficial: {
        githubPersonalAccessToken: requireEnv("GITHUB_TOKEN"),
      },
    },
  });
}

async function connectClaudeToGateway(sbx: Sandbox): Promise<void> {
  const mcpUrl = sbx.getMcpUrl();
  const mcpToken = await sbx.getMcpToken();

  console.log("Sandbox created.");
  console.log(`MCP Gateway URL: ${mcpUrl}\n`);

  await new Promise<void>((resolve) => setTimeout(resolve, 3000));

  console.log("Connecting Claude Code to MCP gateway...");
  await sbx.commands.run(
    `claude mcp add --transport http e2b-mcp-gateway ${mcpUrl} --header "Authorization: Bearer ${mcpToken}"`,
    {
      timeoutMs: 0,
      onStdout: (d) => process.stdout.write(d),
      onStderr: (d) => process.stderr.write(d),
    },
  );
}

async function quickstart(): Promise<void> {
  console.log("Creating E2B sandbox with Notion + GitHub MCP servers...\n");
  const sbx = await createMcpSandbox();
  try {
    await connectClaudeToGateway(sbx);
    console.log("\nConnection successful.");
  } finally {
    console.log("Cleaning up sandbox...");
    await sbx.kill();
  }
}

async function exampleWorkflow(): Promise<void> {
  const repo = process.env.GITHUB_TEST_REPO ?? "owner/repo";
  console.log("Creating sandbox for workflow demo...\n");
  const sbx = await createMcpSandbox();
  try {
    await connectClaudeToGateway(sbx);

    const prompt = `Using Notion and GitHub MCP tools:
1. Search my Notion workspace for databases
2. Create a test issue in ${repo} titled "MCP Toolkit Test" with description "Testing E2B + Docker MCP integration"
3. Confirm both operations completed successfully`;

    console.log("\nRunning Claude workflow...\n");
    const escaped = prompt.replace(/'/g, "'\\''");
    await sbx.commands.run(
      `echo '${escaped}' | claude -p --dangerously-skip-permissions`,
      {
        timeoutMs: 0,
        onStdout: (d) => process.stdout.write(d),
        onStderr: (d) => process.stderr.write(d),
      },
    );
  } finally {
    await sbx.kill();
  }
}

const runWorkflow = process.argv.includes("--workflow");
(runWorkflow ? exampleWorkflow() : quickstart()).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
