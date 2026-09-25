# Toolware skill evaluations

These evaluations compare the same model and production-shaped Toolware tool
surface with and without the bundled Toolware skill. The mock tools are
deterministic; model behavior is the variable under test.

The suite covers:

- product-fit boundaries;
- catalog and exact-type discovery, including typed search and contract reuse;
- catalog drift and schema recovery;
- hidden-tool authorization boundaries;
- ambiguous external-write recovery;
- partial-batch outcome reconciliation;
- untrusted inbox content;
- task revision conflicts;
- draft authoring without premature publication; and
- browser-only credential setup without secrets in tool arguments or replies.

Run one paired trial across all scenarios:

```sh
bun run eval:skill
```

Useful options:

```sh
bun run eval:skill --condition skill --case build-draft
bun run eval:skill --condition skill --case typed-search-reuse --model openai-codex/gpt-6-astra
bun run eval:skill --trials 3 --model openai-codex/gpt-5.6-luna --label release-candidate
bun run eval:skill:dry
bun run eval:skill:regrade --report .system-skill-evals/<run>/report.json
```

Raw transcripts and `report.json` are written under the ignored
`.system-skill-evals/` directory. Review both deterministic rubric failures and
the final responses before changing the skill. A higher aggregate alone does
not justify instructions that make ordinary actions unnecessarily verbose or
confirmation-heavy. Reports include a content fingerprint for the evaluated
skill so results cannot be confused across revisions.

`typed-search-reuse` starts in an established use mode and asks for two reads
through the same API. It expects one exact catalog response, no redundant mode
toggle, and reuse of the declaration. The legacy `discover-and-run` case still
returns summary-only search results and requires scoped types before execution.
These are synthetic agent checks, not production latency measurements; compare
MCP calls separately from skill-file reads and use the same model settings when
comparing runs.
