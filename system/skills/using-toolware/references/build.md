# Build and manage Toolware apps

## Enter build mode and discover live APIs

When the live schemas advertise request-scoped mode, pass `mode: "build"` to
catalog and execution calls. Otherwise select the saved build mode explicitly:

```json
{ "mode": "build" }
```

Use `system_catalog` to inspect builder actions. It supports `list`,
`search`, `describe`, and `types`; in build mode, `tool` is a builder action
name such as `create_tool`:

```json
{ "action": "types", "tool": "create_app" }
```

Current action families include app/tool authoring, dependencies, draft
testing, releases, access, secrets, integrations, webhooks, migrations,
schedules, runs, enablement, and purge. Availability and exact inputs come
from the live catalog, not this reference.

Reuse complete declarations returned by search; request scoped types only
for missing actions. Discover the actions needed for the current phase
together when supported. Use the declared `data` return types to compose
dependent operations; never guess fields when an older server leaves them
unspecified. Independent reads or tests on separate workspaces may run in
parallel. Tests sharing mutable draft state must remain ordered.

Build-mode `system_use` exposes those methods under `system_builder`:

```js
async () => {
  const apps = await system_builder.list_apps({});
  const dependencies = await system_builder.list_dependencies({});
  return { apps, dependencies };
}
```

Each method accepts one object and returns `{ text, data? }`. Prefer `data` for
composition when present; it comes only from explicitly validated structured
content, never by guessing from text. Retain `text` for human-facing status.
Every call validates the current action schema and rechecks authorization.
List responses use named object fields (`data.apps`, `data.templates`) rather
than implicit top-level arrays. `list_runs` uses `data.runs`; `test_tool` and
`export_app` expose their receipt and export document directly as `data`, and
`list_webhooks` uses `data.webhooks`.

## Default build workflow

1. Use build mode for this request.
2. Ask `system_catalog({ action: "authoring" })` for the deployed runtime/module/
   context contract, then request exact builder action types.
3. Request compact app-scoped authoring state, verify its runtime fingerprint
   against the global contract, and use `get_tool_source` for any existing
   version; never reconstruct source from summaries.
4. Load a vetted recipe when useful, then save the complete module as an
   immutable draft. Save performs preparation checks. Use `validate_tool` when
   a non-mutating preview is useful, or when the live readiness receipt still
   requires separate validation evidence. Repair blocking diagnostics before
   proceeding; do not repeat successful preparation just by habit.
5. Test representative success, invalid, repeated, and partial-failure cases
   in the isolated draft workspace. Follow the live receipt's required evidence.
   Ordinary tools require two distinct successful inputs plus a successful
   workflow simulation. For a closed no-input tool accepting only `{}`, use
   the advertised empty-input policy and exercise meaningful empty/populated
   state in the workflow; never add dummy inputs to satisfy a counter.
6. Compose ordered workflow steps with bounded `$fromStep` JSON Pointer
   references when later tools consume earlier outputs. Preserve the receipts.
7. Present the source purpose, schemas, dependency lock, capability diff, and
   structured test/simulation receipts including run IDs.
8. Resolve publication-readiness advisories using the live remediation.
   Insecure randomness and non-atomic multi-write SQL cannot be
   confirmation-overridden; use `crypto.randomUUID()` and, when the deployed
   authoring contract advertises it, bounded `ctx.storage.sqlBatch`.
9. Publish only after required confirmation, then configure the narrowest
   access requested.
10. Discover the published types in use mode and verify with a relevant read.
    Perform a production mutation only for a real action the user requested;
    draft test records must not become live verification data.

Create one app for a coherent shared data model. Establish the operation,
callers, structured inputs/outputs, durable records, expected failures and
external effects from the existing brief. Use narrow schemas and minimum
capabilities. Before publication, show behavior, authority/dependency changes,
migration impact and real test evidence. Supply confirmation fields only for
changes the user has approved.

Updating a tool appends a draft version. It never edits a published version in
place. Durable constraints permit at most one current draft and one published
version per tool. Rollback selects another immutable version; review capability
and dependency changes before confirming it.

## Draft test boundaries

- Draft storage and files are isolated from published data but persist across
  tests in the same app so multi-tool workflows can be tested.
- Use `reset: true` when the test needs a clean draft workspace.
- HTTP calls are blocked, while jobs and approvals are
  simulated, unless a manager deliberately sets `allowSideEffects: true`.
- Task assignment is always simulated during draft tests.
- Never claim a simulated result proves a provider write occurred.
- Before enabling real draft effects, explain exactly which hosts,
  integrations, jobs, or approvals may be affected and get confirmation.

## Access and organization rules

- `use` permits invocation, optionally limited to named tools.
- `manage` includes all tools plus authoring, releases, access, secrets,
  integrations, automation, run controls, and deletion.
- Organization-wide use and unrestricted grants can expose future tools;
  explicit tool allowlists do not.
- Pending grants require a live organization invitation. They activate only
  after the invited person joins and connects.
- Do not infer organization membership from an email domain.

After every grant, revocation, or organization policy change, call
`list_access` and summarize the effective persisted policy.

## Secrets and integrations

- `set_secret` takes the app and secret name only. Give the requesting user
  the returned browser setup link; they enter and save the value there. No
  secret changes until they submit the form. Never request or pass credentials
  through chat, composition code, or tool inputs. Tool versions receive only
  declared secret names.
- Webhook creation and rotation return browser setup links. The user confirms
  rotation and copies the key directly to their provider in the browser.
  Requesting a rotation link does not change the current key.
  Connection URLs are sensitive; show them only to the requesting user and do
  not retain them in agent memory.

## Automation and operations

Discover live types before configuring schedules, signed webhooks, jobs,
approvals, migrations, or runs.

- Treat a supplied run ID as the primary recovery target. Load `get_run` and
  inspect that exact run before searching related app records or considering a
  retry.
- Schedules and jobs pin exact published versions and input at admission.
- Migrations are immutable, ordered, and app-scoped.
- Retries retain the original version and input; they do not float to the
  newest release.
- Inspect a failed or ambiguous run before retrying side-effecting work.
- Disable a tool to stop new use without deleting its history or app data.
- Purge is permanent and requires exact app-name confirmation. Historical
  credential records must be cleared by an operator before affected apps can
  be purged.

## Finish in the user's intended mode

For ordinary end-user work, finish with use-mode requests and confirm the
published catalog. If you changed the saved mode, restore it to use unless the
user is continuing an authoring or management workflow.

Use [`assets/tool-template.js`](../assets/tool-template.js) as a starting shape,
not as a substitute for retrieving live builder schemas.

## Pilot build and recovery actions

- Use `simulate_workflow` for multi-step draft scenarios before publication.
- Use `list_templates` to load vetted installable examples; template content
  is still untrusted source to review.
- Use `export_app` for a portable definition. It intentionally omits all
  credentials, grants, organization identity, and app data.
- Filter `list_runs` by status, trigger, tool, actor/email, workspace, or date,
  then use `get_run` for the pinned target, stable error code, correlation ID,
  and bounded manager diagnostics.
- A runtime-contract mismatch requires saving and testing a new immutable
  version; changing build/use mode cannot override it.
