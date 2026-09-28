/// <reference types="bun" />

import { createHash } from "node:crypto";
import { resolve } from "node:path";

import {
  evalCaseById,
  type EvalCondition,
  type ToolCallRecord,
  type ToolResultRecord,
} from "../evals/system-skill/cases.ts";
import {
  runFailed,
  summarizeMeasurements,
  type MeasuredResult,
} from "../evals/system-skill/metrics.ts";

interface StoredResult extends Record<string, unknown>, MeasuredResult {
  readonly condition: EvalCondition;
  readonly finalText: string;
  readonly scenarioId: string;
  readonly toolCalls: readonly ToolCallRecord[];
  readonly toolResults?: readonly ToolResultRecord[];
}

interface StoredReport extends Record<string, unknown> {
  readonly results: readonly StoredResult[];
}

const reportArgument = Bun.argv.find((argument) => argument.startsWith("--report="));
const reportIndex = Bun.argv.indexOf("--report");
const reportPath =
  reportArgument?.slice("--report=".length) ??
  (reportIndex >= 0 ? Bun.argv[reportIndex + 1] : undefined);
if (!reportPath) {
  throw new Error("Provide --report with a Toolware skill report.json path.");
}

const inputPath = resolve(reportPath);
const report = (await Bun.file(inputPath).json()) as StoredReport;
if (!Array.isArray(report.results)) {
  throw new Error(`${inputPath} does not contain evaluation results.`);
}

const results = report.results.map((result) => {
  const scenario = evalCaseById(result.scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario in report: ${result.scenarioId}.`);
  }
  const criteria = scenario.rubric({
    finalText: result.finalText,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
  });
  const passed = criteria.filter((item) => item.passed).length;
  return {
    ...result,
    // Historical reports have no receipt-time measurements; never invent them.
    metrics: result.metrics ?? null,
    criteria,
    passed,
    score: criteria.length === 0 ? 0 : passed / criteria.length,
    total: criteria.length,
  };
});

const conditions = [...new Set(results.map((result) => result.condition))];
const aggregates = conditions.map((condition) => {
  const selected = results.filter((result) => result.condition === condition);
  const passed = selected.reduce((sum, result) => sum + result.passed, 0);
  const total = selected.reduce((sum, result) => sum + result.total, 0);
  return {
    condition,
    passed,
    score: total === 0 ? 0 : passed / total,
    skillActivationRate:
      condition === "skill"
        ? selected.filter(
            (result) => Array.isArray(result.skillReads) && result.skillReads.length > 0,
          ).length / Math.max(1, selected.length)
        : null,
    total,
  };
});

const outputPath = inputPath.replace(/\.json$/u, ".regraded.json");
await Bun.write(
  outputPath,
  JSON.stringify(
    {
      ...report,
      aggregates,
      gradingFingerprint: createHash("sha256")
        .update(await Bun.file(resolve(import.meta.dir, "../evals/system-skill/cases.ts")).bytes())
        .digest("hex")
        .slice(0, 16),
      measurementSummaries: summarizeMeasurements(results),
      regradedAt: new Date().toISOString(),
      results,
      sourceReport: inputPath,
    },
    null,
    2,
  ),
);
for (const aggregate of aggregates) {
  process.stdout.write(
    `${aggregate.condition}: ${(aggregate.score * 100).toFixed(1)}% (${aggregate.passed}/${aggregate.total})\n`,
  );
}
process.stdout.write(`Regraded report: ${outputPath}\n`);
if (results.some(runFailed)) {
  process.exitCode = 1;
}
