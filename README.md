# The Toolware Company Plugins

[Toolware](https://thetoolware.company) lets you discover, run, build, and share
governed team tools from your AI client. This repository packages the skill and
OAuth connection for OpenAI and Anthropic clients.

## Install

You need a Toolware account with access to the intended organization and a
current client with plugin support. No local server or API key is required.
The plugin connects to **https://thetoolware.company/mcp**.

### Codex

Run in your terminal:

```sh
codex plugin marketplace add the-toolware-company/plugins
codex plugin add system@the-toolware-company
```

### Claude Code

Run in your terminal:

```sh
claude plugin marketplace add the-toolware-company/plugins
claude plugin install system@the-toolware-company
```

These install release 0.3.0 from our GitHub marketplace. Official directory
approval is separate; this repository does not imply an approved listing.

### ChatGPT and Claude

Once the official listing is approved, find **Toolware** in your client's
plugin directory, install it, and complete **Connect**. Before approval,
reviewers can connect the remote MCP endpoint through their client's developer
or custom-connector settings. An MCP-only connection does not install the
bundled skill; use the package import flow supported by that client.

## Start using it

1. Start a new conversation after installation.
2. Complete the browser sign-in and consent flow for your Toolware organization.
   In Claude Code, use `/mcp` if authentication is required. Never paste tokens
   or passwords into chat or configuration.
3. Ask: **“Show me the tools and apps I can use in Toolware.”**
4. Then try: **“Explain what Toolware can and cannot do.”** or
   **“Interview me and help me design a Toolware app for my workflow.”**

The `tool-builder` skill leads with focused questions and suggestions, then
produces a reviewable brief covering records, operations, access, and example
outcomes. The `system` skill builds and tests the agreed app through MCP.

An empty authorized catalog is a valid result: your organization may not have
shared any tools yet. Your organization and app permissions determine which
tools you can use or manage.

The technical plugin/skill/server identifier remains `system`; the marketplace
is `the-toolware-company`. If you installed from the previous marketplace,
remove that old plugin through the client's plugin manager, install this one,
and reconnect. OAuth consent for the old domain does not transfer to the new
one. See [connection troubleshooting](system/skills/system/references/setup.md).

## Package and support

- [Package details](system/README.md)
- [Setup](system/SETUP.md)
- [Support and safe issue reporting](SUPPORT.md)
- [Publication checklist and submission instructions](system/PUBLISHING.md)
- [Report an issue](https://github.com/the-toolware-company/plugins/issues)
  (do not include credentials or private workspace data)

This public repository contains plugin metadata, skills, connection manifests,
docs, validation tooling, and listing assets. Product services are maintained
separately.

## License

The plugin code and documentation are distributed under the [MIT license](LICENSE).
The hosted Toolware service remains governed by its service terms. No trademark
rights or endorsement are granted by this package license.

## Validate locally

Install [Bun](https://bun.sh/), then run from this repository:

```sh
bun install --frozen-lockfile
bun run validate
bun run test:install
bun run test:live
```

Validation checks formatting, types, evaluation grading, synchronized metadata,
branding, and Claude's strict schemas. Install tests use isolated client config
directories. The read-only live check verifies production status and OAuth
metadata; it does not authenticate or prove a full user workflow.

Optional [skill evaluations](evals/system-skill/README.md) require a configured
model provider. Historical reports describe their original skill fingerprint,
not the current release.
The [tool builder interview checks](evals/tool-builder/README.md) cover idea
discovery, existing briefs, platform fit, and planning-only revisions.
