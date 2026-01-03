import type { TestResult, UnifiedTestReport } from "../schemas.js";

/**
 * Shared reporter types for generating UnifiedTestReport output.
 */
export type { TestResult, UnifiedTestReport };

export type ReporterTestStatus = "pass" | "fail" | "skip";

export interface ReporterTestResultError {
    message: string;
    expected?: string;
    actual?: string;
    stack?: string;
}

/**
 * Minimal Jest assertion result shape (avoids pulling in @types/jest).
 */
export interface JestAssertionResult {
    title: string;
    fullName?: string;
    status: "passed" | "failed" | "pending" | "todo" | "skipped";
    duration?: number | null;
    failureMessages?: string[];
    location?: {
        line: number;
        column: number;
    } | null;
    ancestorTitles?: string[];
}

export interface JestTestResult {
    testFilePath: string;
    assertionResults: JestAssertionResult[];
    perfStats?: {
        runtime?: number;
    };
    testExecError?: {
        message?: string;
        stack?: string;
    } | null;
}

export interface JestAggregatedResult {
    startTime?: number;
    numFailedTests?: number;
    numPassedTests?: number;
    numPendingTests?: number;
    numTodoTests?: number;
    testResults: JestTestResult[];
}
