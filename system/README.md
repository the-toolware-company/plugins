# Toolware Agent Plugin

Toolware, from [The Toolware Company](https://thetoolware.company), connects your
AI client to governed team tools. Install it using the
[quick-start instructions](https://github.com/the-toolware-company/plugins#install),
sign in, and ask: **“Show me the tools and apps I can use in Toolware.”**

The production MCP endpoint is `https://thetoolware.company/mcp`. Authentication
uses browser OAuth managed by your client; no credentials belong in this package.

## Package layout

| File | Purpose |
| --- | --- |
| `.codex-plugin/plugin.json` | OpenAI-compatible plugin metadata and presentation |
| `.claude-plugin/plugin.json` | Anthropic plugin metadata |
| `.mcp.json` | Native client MCP connection |
| `plugin.json` and `mcp.json` | Portable Agent Plugins 1.0.0 manifests |
| `skills/using-toolware/SKILL.md` | Shared discovery, use, authoring, and safety workflow |
| `skills/toolware-tool-builder/SKILL.md` | Guided interview, app suggestions, data model, and reviewable build brief |
| `SETUP.md` | Connection verification |
| `assets/system-mark.svg` | The Toolware Company listing icon |

The core skill is `using-toolware` (Using Toolware). The plugin name and MCP
server key remain `system` to match the existing integration. The publisher
and repository marketplace use The Toolware Company.

To shape an idea, ask: **“Interview me and help me design a Toolware app for
tracking customer requests.”** The `toolware-tool-builder` skill asks focused questions,
suggests records and actions, and maintains a brief you can revise before
building. You can start without a connection; deployment-dependent features
remain provisional until verified. A complete specification goes straight to
the existing build workflow.

## Verify the connection

Follow [setup](skills/using-toolware/references/setup.md). The stable MCP tools are
`toggle_build_mode`, `system_catalog`, `system_use`, `system_tasks`, and
`system_inbox`. Select use mode and perform an authenticated catalog read.
Tool discovery alone is insufficient. Published app tools can also appear in
clients that refresh dynamic tool lists.

For authoring, request the deployed contract with
`system_catalog({ action: "authoring" })` in build mode before writing code.
Capabilities, schemas, and publication requirements come from that live
contract. Compare the public `/status` release when diagnosing version drift.

## Maintainers

Run `bun run validate`, `bun run test:install`, and `bun run test:live` from the
repository root. See [PUBLISHING.md](PUBLISHING.md) for listing copy, review
scenarios, submission links, and outstanding gates. Official directory review
is separate from successful local installation.
