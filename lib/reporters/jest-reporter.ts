import type { TestResult, UnifiedTestReport } from "../schemas.js";
import { FileStorage } from "../storage.js";
import type { JestAggregatedResult, JestAssertionResult } from "./types.js";

/**
 * Superpowers-Fusion Jest Reporter
 * Outputs unified test results to .fusion/test-results.json for TDD enforcement.
 */
export default class FusionJestReporter {
    private readonly storage: FileStorage;
    private runStartTime: number;

    constructor() {
        this.storage = new FileStorage();
        this.runStartTime = Date.now();
    }

    onRunStart(): void {
        this.runStartTime = Date.now();
    }

    onRunComplete(_contexts: unknown, results: JestAggregatedResult): void {
        const tests: TestResult[] = [];
        const unhandledErrors: Array<unknown> = [];

        for (const fileResult of results.testResults) {
            for (const assertion of fileResult.assertionResults) {
                tests.push(this.mapAssertion(fileResult.testFilePath, assertion));
            }

            if (fileResult.testExecError) {
                unhandledErrors.push({
                    file: fileResult.testFilePath,
                    message: fileResult.testExecError.message,
                    stack: fileResult.testExecError.stack,
                });
            }
        }

        const passed = results.numPassedTests ?? tests.filter((t) => t.status === "pass").length;
        const failed = results.numFailedTests ?? tests.filter((t) => t.status === "fail").length;
        const skipped =
            (results.numPendingTests ?? tests.filter((t) => t.status === "skip").length) +
            (results.numTodoTests ?? 0);

        const duration = this.calculateDuration(results.startTime);
        const report: UnifiedTestReport = {
            timestamp: new Date().toISOString(),
            duration,
            summary: { passed, failed, skipped },
            reason: failed > 0 ? "failed" : "passed",
            tests,
            unhandledErrors: unhandledErrors.length > 0 ? unhandledErrors : undefined,
        };

        this.storage
            .saveTest(JSON.stringify(report, null, 2))
            .catch((error) => console.error(`[FusionJestReporter] Failed to write test results: ${String(error)}`));
    }

    private calculateDuration(startTime?: number): number {
        if (typeof startTime === "number" && Number.isFinite(startTime)) {
            return Math.max(0, Date.now() - startTime);
        }
        return Math.max(0, Date.now() - this.runStartTime);
    }

    private mapAssertion(testFilePath: string, assertion: JestAssertionResult): TestResult {
        const status: TestResult["status"] =
            assertion.status === "failed" ? "fail"
                : assertion.status === "passed" ? "pass"
                    : "skip";

        const error =
            assertion.failureMessages && assertion.failureMessages.length > 0
                ? {
                    message: assertion.failureMessages.join("\n\n"),
                }
                : undefined;

        return {
            name: assertion.title,
            fullName: assertion.fullName ?? this.buildFullName(testFilePath, assertion),
            status,
            duration: assertion.duration ?? 0,
            error,
        };
    }

    private buildFullName(testFilePath: string, assertion: JestAssertionResult): string {
        const suite = assertion.ancestorTitles && assertion.ancestorTitles.length > 0
            ? assertion.ancestorTitles.join(" > ")
            : testFilePath;
        return `${suite} > ${assertion.title}`;
    }
}
