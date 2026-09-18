---
name: setup-system
description: Connect and verify the OAuth-protected Toolware production MCP server after installing the Toolware plugin. Use when Toolware is newly installed, disconnected, unauthenticated, or missing expected tools.
---

# Set up Toolware

Read [`skills/using-toolware/references/setup.md`](./skills/using-toolware/references/setup.md) and
follow its connection and verification workflow.

Use the bundled `system` MCP server, which connects to the production
Toolware environment. Let the client discover OAuth and open
the browser sign-in flow; never ask the user to paste a token, cookie, client
secret, or authorization header into chat or plugin configuration.

Setup is complete only after the stable tools load and an authenticated
`system_catalog({ action: "list" })` succeeds in use mode. Tool definitions
alone do not prove the connection works.
