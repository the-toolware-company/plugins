# Toolware skill evaluations

These evaluations compare the same model and production-shaped Toolware tool
surface with and without the bundled Toolware skill. The mock tools are
deterministic; model behavior is the variable under test.

The suite covers:

- product-fit boundaries;
- catalog and exact-type discovery, including typed search and contract reuse;
- first use with request-scoped mode, an already discovered contract, and
  multiple intended parts-list additions in one composition;
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
bun run eval:skill --condition skill --case routine-first-use --case known-contract-reuse --trials 3 --model openai-codex/gpt-6-astra --thinking low
bun run eval:skill --trials 3 --model openai-codex/gpt-5.6-luna --label release-candidate
bun run eval:skill:dry
bun run eval:skill:regrade --report .system-skill-evals/<run>/report.json
```

Raw transcripts and `report.json` are written under the ignored
`.system-skill-evals/` directory. Review both deterministic rubric failures and
the final responses before changing the skill. A higher aggregate alone does
not justify instructions that make ordinary actions unnecessarily verbose or
confirmation-heavy. Reports include a content fingerprint for the evaluated
skill, mock, scenarios and model settings so results cannot be confused across
revisions. Reports retain every trial and group timing summaries by scenario
and condition. Conditions are interleaved within each trial.

`typed-search-reuse` starts in an established use mode and asks for two reads
through the same API. It expects one exact catalog response, no redundant mode
toggle, and reuse of the declaration. The legacy `discover-and-run` case still
returns summary-only search results and requires scoped types before execution.
`routine-first-use` starts with a saved build-mode credential and expects use-mode
discovery and execution without a toggle. `known-contract-reuse` supplies an exact
declaration returned earlier in the task and expects one execution without
discovery. `multiple-parts-add` expects two intended additions with separate
outcomes in one composition. Routine cases allow at most one entry-skill read
and no reference reads; safety and build cases retain their relevant references.

## Measurements and failures

Each run records assistant turns, MCP calls, ordinary reads, skill reads and
UTF-8 text bytes returned by those reads. Tool timings pair start/end events by
call ID, including concurrent calls. Missing events produce null timings and an
incomplete-call failure. Times use monotonic event receipt at the harness;
events do not provide execution timestamps. The report also records the first
consumer execution and its first successful result, excluding tool errors and
builder calls. Consumer detection recognizes literal app namespaces in these
synthetic fixtures; it is not a general JavaScript execution profiler.

Provider failures are recorded even when the runner exits zero. Recovered
provider errors remain visible; terminal provider errors, incomplete calls,
timeouts, unsettled runs and failed behavioral criteria exit nonzero. Expected
tool failures in recovery scenarios are judged by the scenario's safety rubric.

Timing summaries include sample count, median and range for settled,
behavior-passing runs with no provider errors. Failed, unmeasured and recovered
provider-error runs remain visible outside that timing sample. Regrading keeps
existing measurements and recomputes eligibility; old reports without them stay
unmeasured. A single trial is not evidence of a stable percentile or speedup.

These are synthetic agent checks, not production latency measurements. The mock
recognizes a bounded set of fixture actions; it does not execute arbitrary
JavaScript or contact real MCP/database services. Per-tool timing measures mock
and adapter work, while total time includes the model, client and harness. Do
not label the remaining time as pure model latency. Compare only matching
scenario/mock fingerprints and model settings, recording the skill revision
being compared; never pool unrelated scenarios to claim a speedup.
