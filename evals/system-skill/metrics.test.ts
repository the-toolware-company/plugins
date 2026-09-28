import { describe, expect, test } from "bun:test";

import { EventMetrics, runFailed, summarizeMeasurements, type MeasuredResult } from "./metrics.ts";

const start = (
  toolCallId: string,
  toolName = "system_use",
  args: unknown = { code: "async () => app_parts.add({ name: 'bolt' })" },
) => ({ type: "tool_execution_start", toolCallId, toolName, args });
const end = (
  toolCallId: string,
  result: unknown = { content: [{ type: "text", text: "done" }] },
  isError = false,
) => ({ type: "tool_execution_end", toolCallId, toolName: "system_use", result, isError });
const assistant = (type: string, extra = {}) => ({
  type,
  message: { role: "assistant", ...extra },
});

describe("event measurements", () => {
  test("counts model turns, MCP calls, read calls and returned UTF-8 skill bytes separately", () => {
    const metrics = new EventMetrics();
    metrics.accept(assistant("message_start"), 0);
    metrics.accept({ type: "message_start", message: { role: "toolResult" } }, 1);
    metrics.accept(start("read", "read", { path: "/skill/using-toolware/SKILL.md" }), 2);
    metrics.accept(
      end("read", {
        content: [
          { type: "text", text: "Bolt 🔩" },
          { type: "text", text: "é" },
        ],
      }),
      5,
    );
    metrics.accept(assistant("message_start"), 6);
    metrics.accept(start("catalog", "system_catalog", { action: "search" }), 7);
    metrics.accept(end("catalog"), 8);
    metrics.accept(start("use"), 9);
    metrics.accept(end("use"), 15);
    metrics.accept(assistant("message_start"), 16);
    metrics.accept(assistant("message_end", { stopReason: "stop" }), 18);
    expect(metrics.snapshot()).toMatchObject({
      assistantTurns: 3,
      mcpCalls: 2,
      readCalls: 1,
      skillReadCount: 1,
      skillReadBytes: 11,
      firstConsumerExecutionMs: 9,
      firstSuccessfulConsumerResultMs: 15,
      incompleteToolCalls: 0,
      providerErrors: [],
      terminalProviderError: null,
    });
  });

  test("pairs concurrent same-name calls by ID despite out-of-order completion", () => {
    const metrics = new EventMetrics();
    metrics.accept(start("a"), 3);
    metrics.accept(start("b"), 5);
    metrics.accept(end("b"), 8);
    metrics.accept(end("a"), 15);
    expect(
      metrics.snapshot().tools.map(({ toolCallId, durationMs }) => ({ toolCallId, durationMs })),
    ).toEqual([
      { toolCallId: "a", durationMs: 12 },
      { toolCallId: "b", durationMs: 3 },
    ]);
    expect(metrics.snapshot().firstSuccessfulConsumerResultMs).toBe(8);
  });

  test("missing starts, ends and IDs remain unpaired with null durations", () => {
    const metrics = new EventMetrics();
    metrics.accept(start("pending", "read", { path: "/skill/references/use.md" }), 5);
    metrics.accept(end("orphan"), 8);
    metrics.accept({ type: "tool_execution_start", toolName: "system_use" }, 9);
    metrics.accept({ type: "tool_execution_end", toolName: "system_use", result: {} }, 11);
    const result = metrics.snapshot();
    expect(result.incompleteToolCalls).toBe(4);
    expect(result.tools.map((call) => call.durationMs)).toEqual([null, null, null, null]);
    expect(result.skillReadBytes).toBeNull();
    expect(result.firstSuccessfulConsumerResultMs).toBeNull();
  });

  test("matches IDs even if an end is received first, without inventing a duration", () => {
    const metrics = new EventMetrics();
    metrics.accept(end("a"), 2);
    metrics.accept(start("a"), 8);
    expect(metrics.snapshot().tools[0]?.durationMs).toBeNull();
    expect(metrics.snapshot().firstSuccessfulConsumerResultMs).toBeNull();
    expect(metrics.snapshot().incompleteToolCalls).toBe(1);
  });

  test("failed consumer executions and nested MCP errors do not count as success", () => {
    const metrics = new EventMetrics();
    metrics.accept(start("outer"), 1);
    metrics.accept(end("outer", {}, true), 2);
    metrics.accept(start("nested"), 3);
    metrics.accept(end("nested", { isError: true }), 4);
    metrics.accept(start("details"), 5);
    metrics.accept(end("details", { details: { isError: true } }), 6);
    metrics.accept(
      start("readback", "system_use", { code: "async () => system_runtime.get_run({id:'x'})" }),
      7,
    );
    metrics.accept(end("readback"), 8);
    expect(metrics.snapshot().firstSuccessfulConsumerResultMs).toBeNull();
    metrics.accept(start("success"), 9);
    metrics.accept(end("success", { details: { value: { isError: true } } }), 10);
    expect(metrics.snapshot().firstConsumerExecutionMs).toBe(1);
    expect(metrics.snapshot().firstSuccessfulConsumerResultMs).toBe(10);
  });

  test("malformed completions without result or a boolean error flag remain incomplete", () => {
    for (const completion of [
      { result: {} },
      { isError: false },
      { result: {}, isError: "false" },
    ]) {
      const metrics = new EventMetrics();
      metrics.accept(start("a"), 1);
      metrics.accept(
        { type: "tool_execution_end", toolCallId: "a", toolName: "system_use", ...completion },
        2,
      );
      expect(metrics.snapshot()).toMatchObject({
        firstSuccessfulConsumerResultMs: null,
        incompleteToolCalls: 1,
      });
      expect(metrics.snapshot().tools[0]).toMatchObject({
        endedAtMs: null,
        durationMs: null,
        isError: null,
      });
    }
  });

  test("only recognized successful assistant endings recover provider errors", () => {
    for (const successReason of ["stop", "length", "toolUse"]) {
      const metrics = new EventMetrics();
      metrics.accept(
        assistant("message_end", { stopReason: "error", errorMessage: "provider failure" }),
        1,
      );
      for (const stopReason of [undefined, "unknown", "pending", "deferred"]) {
        metrics.accept(assistant("message_end", { stopReason }), 2);
        expect(metrics.snapshot().terminalProviderError).toBe("provider failure");
      }
      metrics.accept(assistant("message_end", { stopReason: successReason }), 3);
      expect(metrics.snapshot().terminalProviderError).toBeNull();
      expect(metrics.snapshot().providerErrors[0]?.recovered).toBe(true);
    }
  });

  test("retains recovered provider errors and identifies terminal errors even after settling", () => {
    const metrics = new EventMetrics();
    metrics.accept(assistant("message_start"), 0);
    metrics.accept(
      assistant("message_end", { stopReason: "error", errorMessage: "temporary provider failure" }),
      4,
    );
    expect(metrics.snapshot().terminalProviderError).toBe("temporary provider failure");
    metrics.accept(assistant("message_start"), 6);
    metrics.accept(assistant("message_end", { stopReason: "stop" }), 8);
    expect(metrics.snapshot()).toMatchObject({
      terminalProviderError: null,
      providerErrors: [{ atMs: 4, message: "temporary provider failure", recovered: true }],
    });
    metrics.accept(
      assistant("message_end", { stopReason: "error", errorMessage: "model unsupported" }),
      9,
    );
    metrics.accept({ type: "agent_settled" }, 10);
    expect(metrics.snapshot().terminalProviderError).toBe("model unsupported");
    expect(metrics.snapshot().providerErrors[1]?.recovered).toBe(false);
  });
});

describe("measurement summaries and run failures", () => {
  const successful = (scenarioId = "parts", durationMs = 10): MeasuredResult => ({
    scenarioId,
    condition: "skill",
    durationMs,
    settled: true,
    error: null,
    timedOut: false,
    passed: 2,
    total: 2,
    metrics: new EventMetrics().snapshot(),
  });

  test("summarizes matching scenarios independently and keeps exclusions visible", () => {
    const recovered = new EventMetrics();
    recovered.accept(assistant("message_end", { stopReason: "error", errorMessage: "retry" }), 1);
    recovered.accept(assistant("message_end", { stopReason: "stop" }), 2);
    const summaries = summarizeMeasurements([
      successful("parts", 10),
      successful("parts", 30),
      successful("orders", 900),
      { ...successful("parts", 999), passed: 1 },
      { ...successful("parts", 888), metrics: recovered.snapshot() },
      { ...successful("parts", 777), metrics: null },
    ]);
    expect(summaries[0]).toMatchObject({
      scenarioId: "parts",
      runs: 5,
      eligibleRuns: 2,
      failedRuns: 1,
      providerErrorRuns: 1,
      unmeasuredRuns: 1,
      durationMs: { count: 2, median: 20, min: 10, max: 30 },
      firstConsumerExecutionMs: { count: 0, median: null, min: null, max: null },
    });
    expect(summaries[1]?.durationMs.median).toBe(900);
  });

  test("rubric, terminal provider, incomplete and process failures fail even if settled", () => {
    const provider = new EventMetrics();
    provider.accept(
      assistant("message_end", { stopReason: "error", errorMessage: "unsupported" }),
      1,
    );
    const incomplete = new EventMetrics();
    incomplete.accept(start("pending"), 1);
    for (const result of [
      { ...successful(), passed: 1 },
      { ...successful(), error: "exit=1" },
      { ...successful(), settled: false },
      { ...successful(), timedOut: true },
      { ...successful(), metrics: provider.snapshot() },
      { ...successful(), metrics: incomplete.snapshot() },
    ])
      expect(runFailed(result)).toBe(true);
    expect(runFailed(successful())).toBe(false);
  });

  test("historical missing metrics never become zero timing samples", () => {
    expect(summarizeMeasurements([{ ...successful(), metrics: null }])[0]).toMatchObject({
      eligibleRuns: 0,
      unmeasuredRuns: 1,
      durationMs: { count: 0, median: null, min: null, max: null },
    });
  });
});
