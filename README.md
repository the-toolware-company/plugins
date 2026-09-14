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

### ChatGPT

You can connect before public-directory approval:

1. Open Settings → Security and login and enable Developer mode, if available
   under your account and workspace policy.
2. Open [ChatGPT Plugins](https://chatgpt.com/plugins), select the plus button,
   and name the connection **Toolware**.
3. Enter **https://thetoolware.company/mcp** and use OAuth if asked.
4. Sign in, select your Toolware organisation and review consent. Enable the
   connection in a new conversation, then use the check below.

If your administrator already published a Toolware workspace plugin, open it
and choose **Connect**. See the [official setup guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

### Claude

1. Open [Customize → Connectors](https://claude.ai/customize/connectors), then
   **+ → Add custom connector** on an eligible plan.
2. Name it **Toolware** and enter **https://thetoolware.company/mcp**. Leave
   advanced OAuth credentials blank; Toolware supports automatic registration.
3. Choose **Add**, then **Connect**. Sign in, select your organisation and
   review consent.
4. In a new conversation, open **+ → Connectors** and enable Toolware.

For Team or Enterprise, an owner first adds it through **Organization settings
→ Connectors → Add → Custom → Web**. See the [official connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

A custom connection supplies the MCP tools. The Codex and Claude Code plugins
also bundle our workflow skills. Public directory submissions are separate
from this GitHub marketplace; no approved listing is claimed here.

## Start using it

1. Start a new conversation after installation.
2. Complete the browser sign-in and consent flow for your Toolware organization.
   In Claude Code, use `/mcp` if authentication is required. Never paste tokens
   or passwords into chat or configuration.
3. Ask: **“Connect to Toolware, select use mode, and list the apps and tools I
   can use. Do not run any app tools yet.”** A successful catalog response
   confirms the connection; seeing tool definitions alone does not.
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
