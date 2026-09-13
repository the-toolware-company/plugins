import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const nativeMcp = (await Bun.file(resolve(root, "system/.mcp.json")).json()) as {
  mcpServers: { system: { url: string } };
};
const expectedMcpUrl = "https://thetoolware.company/mcp";
if (nativeMcp.mcpServers.system.url !== expectedMcpUrl) {
  throw new Error(`Toolware must use the production MCP server at ${expectedMcpUrl}.`);
}

const run = async (command: string[], extraEnv: Record<string, string>): Promise<string> => {
  const process = Bun.spawn(command, {
    cwd: root,
    env: { ...Bun.env, ...extraEnv },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed with exit code ${exitCode}:\n${stderr || stdout}`);
  }
  return stdout;
};

const codexHome = await mkdtemp(join(tmpdir(), "system-codex-"));
const claudeHome = await mkdtemp(join(tmpdir(), "system-claude-"));

try {
  const codexEnv = { CODEX_HOME: codexHome };
  await run(["codex", "plugin", "marketplace", "add", root, "--json"], codexEnv);
  await run(["codex", "plugin", "add", "system@the-toolware-company", "--json"], codexEnv);
  const codexList = JSON.parse(await run(["codex", "plugin", "list", "--json"], codexEnv)) as {
    installed?: { enabled?: boolean; pluginId?: string }[];
  };
  if (
    !codexList.installed?.some(
      (plugin) => plugin.pluginId === "system@the-toolware-company" && plugin.enabled === true,
    )
  ) {
    throw new Error("Codex did not report Toolware as an enabled plugin.");
  }

  const claudeEnv = { CLAUDE_CONFIG_DIR: claudeHome };
  await run(["claude", "plugin", "marketplace", "add", root], claudeEnv);
  await run(["claude", "plugin", "install", "system@the-toolware-company"], claudeEnv);
  const claudeList = JSON.parse(await run(["claude", "plugin", "list", "--json"], claudeEnv)) as {
    enabled?: boolean;
    id?: string;
    mcpServers?: { system?: { url?: string } };
  }[];
  if (
    !claudeList.some(
      (plugin) =>
        plugin.id === "system@the-toolware-company" &&
        plugin.enabled === true &&
        plugin.mcpServers?.system?.url === expectedMcpUrl,
    )
  ) {
    throw new Error("Claude did not report Toolware with the expected MCP server.");
  }
} finally {
  await Promise.all([
    rm(codexHome, { force: true, recursive: true }),
    rm(claudeHome, { force: true, recursive: true }),
  ]);
}

process.stdout.write("OpenAI and Claude isolated marketplace installs passed.\n");
