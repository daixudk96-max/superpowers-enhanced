/**
 * Zod Schemas for TDD state validation
 *
 * Provides runtime type validation for state files (config, lint, test results).
 * Ensures data integrity and provides TypeScript types via inference.
 */

import { z } from "zod";

// ============================================================================
// Guard Configuration
// ============================================================================

/**
 * Schema for runtime TDD guard configuration
 * Stored in .fusion/config.json
 */
export const GuardConfigSchema = z.object({
    /** Whether TDD guard is enabled (runtime override for TDD_VALIDATION_ENABLED) */
    guardEnabled: z.boolean().optional(),
    /** Glob patterns for files to ignore (e.g., ["*.md", "*.json"]) */
    ignorePatterns: z.array(z.string()).optional(),
});

export type GuardConfig = z.infer<typeof GuardConfigSchema>;

// ============================================================================
// Lint Results
// ============================================================================

/**
 * Schema for individual lint issue
 */
export const LintIssueSchema = z.object({
    file: z.string(),
    line: z.number(),
    column: z.number(),
    severity: z.enum(["error", "warning"]),
    message: z.string(),
    rule: z.string().optional(),
});

export type LintIssue = z.infer<typeof LintIssueSchema>;

/**
 * Schema for lint run results
 * Stored in .fusion/lint-results.json
 */
export const LintResultSchema = z.object({
    timestamp: z.string(),
    files: z.array(z.string()),
    issues: z.array(LintIssueSchema),
    errorCount: z.number(),
    warningCount: z.number(),
    /** Tracks whether user has been notified (for first-warn-then-block) */
    hasNotifiedAboutLintIssues: z.boolean().optional(),
});

export type LintResult = z.infer<typeof LintResultSchema>;

// ============================================================================
// Test Results
// ============================================================================

/**
 * Schema for individual test result
 */
export const TestResultSchema = z.object({
    name: z.string(),
    fullName: z.string().optional(),
    status: z.enum(["pass", "fail", "skip"]),
    duration: z.number(),
    error: z
        .object({
            message: z.string(),
            expected: z.string().optional(),
            actual: z.string().optional(),
            stack: z.string().optional(),
        })
        .optional(),
});

export type TestResult = z.infer<typeof TestResultSchema>;

/**
 * Schema for unified test report (all languages)
 * Stored in .fusion/test-results.json
 */
export const UnifiedTestReportSchema = z.object({
    timestamp: z.string(),
    duration: z.number(),
    summary: z.object({
        passed: z.number(),
        failed: z.number(),
        skipped: z.number(),
    }),
    /** Overall test run result */
    reason: z.enum(["passed", "failed", "interrupted", "unknown"]),
    tests: z.array(TestResultSchema),
    /** Unhandled errors during test run */
    unhandledErrors: z.array(z.unknown()).optional(),
});

export type UnifiedTestReport = z.infer<typeof UnifiedTestReportSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if test report indicates all tests passing
 */
export function isTestPassing(report: UnifiedTestReport): boolean {
    return report.reason === "passed" && report.summary.failed === 0;
}

/**
 * Check if lint result has blocking issues
 */
export function hasBlockingLintIssues(result: LintResult): boolean {
    return result.errorCount > 0;
}
