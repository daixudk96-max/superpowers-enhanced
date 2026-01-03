/**
 * Test Status Checker - Read and evaluate test results
 *
 * Reads .fusion/test-results.json (written by Vitest/Jest reporters)
 * and determines if tests are passing or failing for TDD enforcement.
 */

import { FileStorage, type Storage } from "./storage.js";
import { UnifiedTestReportSchema, type UnifiedTestReport } from "./schemas.js";

export interface TestStatusResult {
    /** Whether TDD should block based on test status */
    blocked: boolean;
    /** Human-readable reason */
    reason: string;
    /** Test summary if available */
    summary?: {
        passed: number;
        failed: number;
        skipped: number;
    };
    /** Whether there are failing tests (needed for Tier 3) */
    hasFailingTest: boolean;
}

/**
 * Check test status for TDD enforcement
 * 
 * For Tier 2: Block if no test file exists
 * For Tier 3: Block if no failing test exists (must write failing test first)
 * 
 * @param filePath - File being edited (to find corresponding test)
 * @param tier - Risk tier for enforcement level
 * @param storage - Optional storage implementation
 */
export async function checkTestStatus(
    _filePath: string,
    tier: number = 2,
    storage?: Storage
): Promise<TestStatusResult> {
    const store = storage ?? new FileStorage();

    // Read test results
    const raw = await store.getTest();
    if (!raw) {
        // No test results file
        if (tier >= 2) {
            return {
                blocked: true,
                reason: "No test results found. Run tests first.",
                hasFailingTest: false,
            };
        }
        return {
            blocked: false,
            reason: "No test results (Tier 1)",
            hasFailingTest: false,
        };
    }

    // Parse test results
    let report: UnifiedTestReport;
    try {
        report = UnifiedTestReportSchema.parse(JSON.parse(raw));
    } catch (error) {
        return {
            blocked: false,
            reason: `Failed to parse test results: ${error}`,
            hasFailingTest: false,
        };
    }

    // Tier 3: Strict test-first - must have failing test
    if (tier >= 3) {
        if (report.summary.failed === 0) {
            return {
                blocked: true,
                reason: "Tier 3: No failing test. Write a failing test first.",
                summary: report.summary,
                hasFailingTest: false,
            };
        }
        // Has failing test - allow edit
        return {
            blocked: false,
            reason: `Tier 3: ${report.summary.failed} failing test(s). Edit allowed.`,
            summary: report.summary,
            hasFailingTest: true,
        };
    }

    // Tier 2: Need test OR exemption
    if (tier >= 2) {
        // Check if tests exist and are running
        if (report.tests.length === 0) {
            return {
                blocked: true,
                reason: "Tier 2: No tests found. Add tests or use TDD-EXEMPT comment.",
                summary: report.summary,
                hasFailingTest: false,
            };
        }

        // Tests exist - check status
        const hasFailingTest = report.summary.failed > 0;
        return {
            blocked: false,
            reason: hasFailingTest
                ? `Tier 2: ${report.summary.failed} failing test(s). Edit allowed.`
                : `Tier 2: All ${report.summary.passed} tests passing.`,
            summary: report.summary,
            hasFailingTest,
        };
    }

    // Tier 0-1: No blocking
    return {
        blocked: false,
        reason: `Tier ${tier}: No TDD enforcement required.`,
        summary: report.summary,
        hasFailingTest: report.summary.failed > 0,
    };
}

/**
 * Get test summary without TDD enforcement logic
 */
export async function getTestSummary(storage?: Storage): Promise<UnifiedTestReport | null> {
    const store = storage ?? new FileStorage();
    const raw = await store.getTest();
    if (!raw) return null;

    try {
        return UnifiedTestReportSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
}
