const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const mcpTools = new Set([
  "toggle_build_mode",
  "system_catalog",
  "system_use",
  "system_tasks",
  "system_inbox",
]);

export const toolResultIsError = (event: Record<string, unknown>): boolean => {
  const result = record(event.result);
  return (
    event.isError === true || result?.isError === true || record(result?.details)?.isError === true
  );
};

export interface ToolTiming {
  readonly toolCallId: string | null;
  readonly name: string;
  readonly startedAtMs: number | null;
  readonly endedAtMs: number | null;
  readonly durationMs: number | null;
  readonly isError: boolean | null;
  readonly skillPath: string | null;
  readonly skillBytes: number | null;
  readonly consumerExecution: boolean;
}

export interface ProviderError {
  readonly atMs: number;
  readonly message: string;
  readonly recovered: boolean;
}

export interface RunMetrics {
  readonly assistantTurns: number;
  readonly mcpCalls: number;
  readonly readCalls: number;
  readonly skillReadCount: number;
  readonly skillReadBytes: number | null;
  readonly firstConsumerExecutionMs: number | null;
  readonly firstSuccessfulConsumerResultMs: number | null;
  readonly incompleteToolCalls: number;
  readonly providerErrors: readonly ProviderError[];
  readonly terminalProviderError: string | null;
  readonly tools: readonly ToolTiming[];
}

interface ObservedTool {
  toolCallId: string | null;
  name: string;
  startedAtMs: number | null;
  endedAtMs: number | null;
  isError: boolean | null;
  skillPath: string | null;
  skillBytes: number | null;
  consumerExecution: boolean;
  result: unknown;
}

/** No clock or I/O: callers supply monotonic milliseconds since process start. */
export class EventMetrics {
  private readonly calls: ObservedTool[] = [];
  private readonly callsById = new Map<string, ObservedTool>();
  private readonly errors: { atMs: number; message: string; recovered: boolean }[] = [];
  private assistantTurns = 0;
  private terminalError: string | null = null;

  accept(value: unknown, elapsedMs: number): void {
    const event = record(value);
    if (!event || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;
    const message = record(event.message);
    if (event.type === "message_start" && message?.role === "assistant") {
      this.assistantTurns += 1;
    }
    if (event.type === "message_end" && message?.role === "assistant") {
      if (
        message.stopReason === "error" ||
        message.stopReason === "aborted" ||
        typeof message.errorMessage === "string"
      ) {
        this.terminalError =
          typeof message.errorMessage === "string"
            ? message.errorMessage
            : String(message.stopReason);
        this.errors.push({ atMs: elapsedMs, message: this.terminalError, recovered: false });
      } else if (["stop", "length", "toolUse"].includes(String(message.stopReason))) {
        this.terminalError = null;
        for (const error of this.errors) error.recovered = true;
      }
    }
    if (event.type !== "tool_execution_start" && event.type !== "tool_execution_end") return;
    const id = typeof event.toolCallId === "string" ? event.toolCallId : null;
    let call = id === null ? undefined : this.callsById.get(id);
    if (!call) {
      call = {
        toolCallId: id,
        name: typeof event.toolName === "string" ? event.toolName : "unknown",
        startedAtMs: null,
        endedAtMs: null,
        isError: null,
        skillPath: null,
        skillBytes: null,
        consumerExecution: false,
        result: undefined,
      };
      this.calls.push(call);
      if (id !== null) this.callsById.set(id, call);
    }
    if (event.type === "tool_execution_start") {
      call.startedAtMs ??= elapsedMs;
      const args = record(event.args);
      const path = args?.path;
      call.skillPath =
        call.name === "read" &&
        typeof path === "string" &&
        /(?:^|[/\\])(?:SKILL|references[/\\][^/\\]+)\.md$/u.test(path)
          ? path
          : null;
      // Synthetic fixtures use literal app namespace calls; this is not a JavaScript parser.
      call.consumerExecution =
        call.name === "system_use" &&
        typeof args?.code === "string" &&
        /\bapp_[A-Za-z0-9_]+\s*\./u.test(args.code);
    } else if (Object.hasOwn(event, "result") && typeof event.isError === "boolean") {
      call.endedAtMs ??= elapsedMs;
      call.isError = toolResultIsError(event);
      call.result = event.result;
    }
    if (call.skillPath !== null && call.endedAtMs !== null) {
      const content = record(call.result)?.content;
      call.skillBytes =
        call.isError === true
          ? 0
          : Array.isArray(content)
            ? content.reduce((sum: number, part: unknown) => {
                const item = record(part);
                return (
                  sum +
                  (item?.type === "text" && typeof item.text === "string"
                    ? new TextEncoder().encode(item.text).byteLength
                    : 0)
                );
              }, 0)
            : null;
    }
  }

  snapshot(): RunMetrics {
    const started = this.calls.filter((call) => call.startedAtMs !== null);
    const skillReads = started.filter((call) => call.skillPath !== null);
    const minimum = (values: readonly number[]): number | null =>
      values.length ? Math.min(...values) : null;
    return {
      assistantTurns: this.assistantTurns,
      mcpCalls: started.filter((call) => mcpTools.has(call.name)).length,
      readCalls: started.filter((call) => call.name === "read").length,
      skillReadCount: skillReads.length,
      skillReadBytes: skillReads.some((call) => call.skillBytes === null)
        ? null
        : skillReads.reduce((sum, call) => sum + (call.skillBytes ?? 0), 0),
      firstConsumerExecutionMs: minimum(
        started.flatMap((call) =>
          call.consumerExecution && call.startedAtMs !== null ? [call.startedAtMs] : [],
        ),
      ),
      firstSuccessfulConsumerResultMs: minimum(
        started.flatMap((call) =>
          call.consumerExecution &&
          call.isError === false &&
          call.endedAtMs !== null &&
          call.startedAtMs !== null &&
          call.endedAtMs >= call.startedAtMs
            ? [call.endedAtMs]
            : [],
        ),
      ),
      incompleteToolCalls: this.calls.filter(
        (call) =>
          call.startedAtMs === null || call.endedAtMs === null || call.endedAtMs < call.startedAtMs,
      ).length,
      providerErrors: this.errors.map((error) => ({ ...error })),
      terminalProviderError: this.terminalError,
      tools: this.calls.map(({ result: _result, ...call }) => ({
        ...call,
        durationMs:
          call.startedAtMs === null || call.endedAtMs === null || call.endedAtMs < call.startedAtMs
            ? null
            : call.endedAtMs - call.startedAtMs,
      })),
    };
  }
}

export interface MeasuredResult {
  readonly condition: string;
  readonly scenarioId: string;
  readonly durationMs?: number | null;
  readonly error?: unknown;
  readonly settled?: unknown;
  readonly timedOut?: unknown;
  readonly passed: number;
  readonly total: number;
  readonly metrics?: RunMetrics | null;
}

export const runFailed = (result: MeasuredResult): boolean =>
  result.error != null ||
  result.settled !== true ||
  result.timedOut === true ||
  result.passed !== result.total ||
  result.metrics?.terminalProviderError != null ||
  (result.metrics?.incompleteToolCalls ?? 0) > 0;

const distribution = (values: readonly number[]) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return {
    count: sorted.length,
    median:
      sorted.length === 0
        ? null
        : sorted.length % 2 === 0
          ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
          : sorted[middle],
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
  };
};

/** Group only identical scenarios/conditions; model and fixture fingerprints live on the report. */
export const summarizeMeasurements = (results: readonly MeasuredResult[]) => {
  const groups = new Map<string, MeasuredResult[]>();
  for (const result of results) {
    const key = JSON.stringify([result.scenarioId, result.condition]);
    const group = groups.get(key) ?? [];
    group.push(result);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const eligible = group.filter(
      (result) =>
        !runFailed(result) && result.metrics != null && result.metrics.providerErrors.length === 0,
    );
    const samples = (select: (result: MeasuredResult) => number | null | undefined) =>
      distribution(
        eligible.flatMap((result) => {
          const value = select(result);
          return typeof value === "number" && Number.isFinite(value) ? [value] : [];
        }),
      );
    return {
      scenarioId: group[0]?.scenarioId,
      condition: group[0]?.condition,
      runs: group.length,
      failedRuns: group.filter(runFailed).length,
      providerErrorRuns: group.filter((result) => (result.metrics?.providerErrors.length ?? 0) > 0)
        .length,
      unmeasuredRuns: group.filter((result) => result.metrics == null).length,
      eligibleRuns: eligible.length,
      durationMs: samples((result) => result.durationMs),
      firstConsumerExecutionMs: samples((result) => result.metrics?.firstConsumerExecutionMs),
      firstSuccessfulConsumerResultMs: samples(
        (result) => result.metrics?.firstSuccessfulConsumerResultMs,
      ),
    };
  });
};
