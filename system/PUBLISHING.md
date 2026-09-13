# Publish Toolware

Release: **0.3.0**. Publisher: **The Toolware Company**.
Package: `system`. Git marketplace: `the-toolware-company`.
Endpoint: **https://thetoolware.company/mcp**.

## Current readiness

The package is released through the GitHub marketplace. Official directory
submission has separate business and legal requirements below. Release checks
on 13 September 2026 established:

- The distribution repository is public at
  <https://github.com/the-toolware-company/plugins>.
- Production `/status` returned healthy, release SHA
  `dcf30ffa0a438eaab1a8ab2dfe6d1258602c856d`, runtime contract `2026-08-19.1`.
- Anonymous `/mcp` returned 401 with an OAuth resource-metadata challenge on
  the new domain. Resource discovery names the new-domain authorization server.
- Formatting, TypeScript, all 10 deterministic grading tests, package metadata,
  and Claude's strict plugin and marketplace validators passed.
- Isolated Codex and Claude marketplace installs passed using temporary client
  configuration directories.
- These checks do not prove browser authorization, refresh/revocation, an
  authenticated catalog read, or starter-prompt behavior.

Official directory submission gates:

- [x] Use MIT for the public plugin package; license files and SPDX metadata
      are included in the distribution and development copies.
- [ ] Finalize service terms and a privacy policy that covers workspace/tool
      data and connected accounts. Add final verified HTTPS URLs to the OpenAI manifest's
      `interface.privacyPolicyURL` and `interface.termsOfServiceURL`.
- [x] Use `support@thetoolware.company`, confirmed by the owner as monitored.
      Public issues are optional for non-confidential bugs; see `SUPPORT.md`.
- [x] Update the GitHub repository's About description and homepage to The
      Toolware Company and `https://thetoolware.company` (13 September 2026).
- [ ] Confirm publisher identity, domain ownership, country availability, and
      submission permissions in the relevant portal. Supply review credentials
      only through its secure fields, never this repository.

## Testing status and reference commands

Browser OAuth lifecycle tests, authenticated catalog scenarios, and live tool
annotation checks were not rerun as part of this package release. If a
submission form requests evidence or attestations, distinguish those untested
workflows from the checks above.

From the repository root:

```sh
bun install --frozen-lockfile
bun run validate
bun run test:install
bun run test:live
```

The live check is read-only and unauthenticated. It checks status, the MCP
challenge, and OAuth discovery; it does not verify browser or authenticated behavior.
The install test exercises both CLIs with temporary configuration directories.
The deterministic grading tests do not rerun the model-based skill evaluations.
Historical evaluation reports are not evidence for the changed skill fingerprint.

## Listing copy

| Field | Value |
| --- | --- |
| Name | Toolware |
| Publisher | The Toolware Company |
| Short description | Build and run governed team tools |
| Description | Discover and run authorized team tools, or create, test, publish, share, and automate new tools through one OAuth-protected connection to Toolware. |
| Category | Productivity / Developer Tools, according to portal options |
| Website | https://thetoolware.company |
| Documentation | https://github.com/the-toolware-company/plugins#readme |
| Support URL | https://github.com/the-toolware-company/plugins/blob/main/SUPPORT.md |
| Support email | support@thetoolware.company |
| Package license | MIT |
| Icon source | `assets/system-mark.svg` |
| Authentication | OAuth through browser sign-in; organization-scoped access |

Use the three starter prompts from `.codex-plugin/plugin.json`. If the portal
requires a raster icon or screenshots, export the existing brand asset in its
requested dimensions and capture real client behavior. Do not submit invented
screenshots or claim a UI that the service does not provide.

## Reviewer scenarios

| Prompt | Expected behavior |
| --- | --- |
| Show me the tools and apps I can use in Toolware. | Sign in, select use mode, list the authorized catalog; accept an empty catalog without inventing tools. |
| Explain what Toolware can and cannot do. | Explain governed tools, access, persistence and automation, plus sandbox and hosting limits. No unrelated organization lookup needed. |
| Help me build and safely publish a Toolware tool. | Discover build schemas and runtime contract, create a harmless draft in the review organization, validate/test/simulate, then present publication evidence and request required confirmation. |

Potential reviewer cases include revoked access, the wrong organization, untrusted tool output, and
an ambiguous external-write failure. The agent must preserve permissions and
avoid automatically retrying a write whose outcome is unknown.

## Submit to OpenAI

Follow the [official submission guide](https://developers.openai.com/plugins/deploy/submission)
and [packaging guide](https://developers.openai.com/plugins/build/plugins).
The supported `.codex-plugin/plugin.json` compatibility manifest bundles the
same skill and MCP connection as the portable files.

1. Open the plugin submission portal linked from the guide using the verified
   publisher organization with Apps Management write access.
2. Choose the remote MCP path, enter the production URL, and attach the skill
   package as requested. Do not submit a reference to an existing integration
   in place of the server.
3. Supply listing copy, final legal URLs, starter prompts, test cases, secure
   review access, and requested domain-verification evidence.
4. Resolve validation findings, submit for review, and publish only after
   approval. Repository marketplace availability is separate from the shared
   ChatGPT/Codex public directory.

## Submit to Anthropic

Follow [Anthropic's plugin instructions](https://code.claude.com/docs/en/plugins)
and [marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces).

1. Provide the public repository and `system/.claude-plugin/plugin.json` package.
2. Include the completed isolated installation results if requested;
   distinguish them from untested application behavior.
3. Submit through [Claude's plugin form](https://claude.ai/settings/plugins/submit)
   or the [Console form](https://platform.claude.com/plugins/submit), supplying
   the same listing materials and isolated review access.
4. Record approval and the actual assigned directory identifier before adding
   official-directory install commands to the README.

A remote connector-only directory listing is a separate submission and does
not automatically distribute the Agent Skill.

## Release maintenance

Keep the portable, Codex, Claude, and Claude marketplace plugin versions
synchronized. Bump the release when bundled instructions, metadata, or assets
change. Keep both MCP manifests on the identical production endpoint without
headers or credentials. The `system` identifier stays stable across this rebrand.

MCP deployments are independently versioned. Never infer that local service code
is deployed or describe assumed behavior as verified. Do not
change an approved OAuth origin without repeating authentication and review.

## Copy-ready submission notes

**Connection and use:** Install Toolware, select Connect, and complete browser
OAuth for the intended organization. Ask “Show me the tools and apps I can use
in Toolware.” An empty authorized catalog is valid. Building or managing tools
requires the appropriate access; build mode does not grant permission.

**Data and permissions:** Toolware processes inputs and returns results for
authorized operations. Depending on the tool, operations can read or write
workspace records, manage tools and access, or interact with connected services.
Final data-use and retention disclosures must match the approved service
privacy notice. Do not claim the plugin is read-only.

**Authentication:** OAuth is discovered by the client. Users select their
organization during authorization. Do not request or include tokens in listing
copy, plugin files or public issue reports.

**Reviewer access:** Enter any review account details only into the portal's
secure fields. Use a representative organization without customer access.
No review credentials or completed browser-workflow results are supplied in
this packet.

**Support:** Monitored email: support@thetoolware.company. Public issues at
https://github.com/the-toolware-company/plugins/issues; see
[SUPPORT.md](https://github.com/the-toolware-company/plugins/blob/main/SUPPORT.md).
The owner confirmed that the support mailbox is monitored.

**Owner-completed portal fields:** Verified legal publisher identity; country
availability; final legal URLs; domain verification; secure reviewer access when requested; and accurate policy
attestations. These have not been inferred or submitted.
