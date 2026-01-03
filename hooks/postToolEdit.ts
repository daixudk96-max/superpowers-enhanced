import { execSync } from "node:child_process";
import { loadConfig } from "../lib/config-loader.js";
import { checkTestQuality } from "../lib/test-quality-checker.js";
import { isTestFile } from "../lib/language-adapter.js";
import { runPostToolEditPipeline } from "../lib/pipeline.js";

export interface PostToolEditEvent {
    toolName: string;
    filePath: string;
    content?: string;
    testOutput?: string;
    taskId?: string;
}

export interface PostToolEditResult {
    gitSha?: string;
    testsPassing?: boolean;
    testIssues?: string[];
    testOutput?: string;
}

/**
 * PostToolEdit Hook - Captures test results and records Git SHA
 */
export function postToolEdit(event: PostToolEditEvent): PostToolEditResult {
    const config = loadConfig();
    const result: PostToolEditResult = {};

    // Check test quality if this is a test file and AST checks are enabled
    if (config.tdd.astChecks && isTestFile(event.filePath) && event.content) {
        const quality = checkTestQuality(event.content, event.filePath, {
            rejectEmptyTests: config.tdd.rejectEmptyTests,
            rejectMissingAssertions: config.tdd.rejectMissingAssertions,
            rejectTrivialAssertions: config.tdd.rejectTrivialAssertions,
        });

        if (!quality.ok) {
            result.testIssues = quality.errors;
        }
    }

    // Capture test output if provided
    if (event.testOutput) {
        result.testOutput = event.testOutput;
        result.testsPassing = parseTestOutput(event.testOutput);
    }

    // Record current Git SHA
    try {
        result.gitSha = execSync("git rev-parse HEAD", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch {
        // Git may be unavailable or not in a repo
    }

    return result;
}

/**
 * Parse test output to determine if tests are passing
 */
function parseTestOutput(output: string): boolean {
    // const lower = output.toLowerCase();

    // Common failure patterns
    const failurePatterns = [
        /\d+\s+fail/i,
        /failed/i,
        /error:/i,
        /assertion.*error/i,
        /FAIL\s/,
    ];

    // Common success patterns
    const successPatterns = [
        /\d+\s+pass(?:ed|ing)?/i,
        /all tests pass/i,
        /tests? passed/i,
        /✓.*test/i,
        /ok\s+\d+\s+test/i,
    ];

    // Check for failures first
    for (const pattern of failurePatterns) {
        if (pattern.test(output)) {
            return false;
        }
    }

    // Check for success indicators
    for (const pattern of successPatterns) {
        if (pattern.test(output)) {
            return true;
        }
    }

    // Unknown - assume tests didn't run cleanly
    return false;
}

/**
 * Record task completion with Git SHA
 */
export function recordTaskCompletion(
    taskId: string,
    sha: string,
    _message: string
): void {
    // This would update .fusion/status.json
    // Implementation handled by status-tracker module
    console.log(`[TDD] Task ${taskId} completed with SHA: ${sha.slice(0, 8)}`);
}

/**
 * NEW: Pipeline-based PostToolEdit Hook
 * 
 * Runs lint-on-green using the new pipeline architecture.
 * This triggers ESLint after successful edits when tests are passing.
 */
export async function postToolEditWithPipeline(event: PostToolEditEvent): Promise<PostToolEditResult> {
    const config = loadConfig();
    const result: PostToolEditResult = {};

    // Run existing quality checks
    if (config.tdd.astChecks && isTestFile(event.filePath) && event.content) {
        const quality = checkTestQuality(event.content, event.filePath, {
            rejectEmptyTests: config.tdd.rejectEmptyTests,
            rejectMissingAssertions: config.tdd.rejectMissingAssertions,
            rejectTrivialAssertions: config.tdd.rejectTrivialAssertions,
        });

        if (!quality.ok) {
            result.testIssues = quality.errors;
        }
    }

    // Run lint-on-green pipeline if tests are passing
    if (config.tdd.lintOnGreen && event.testOutput) {
        const testsPassing = parseTestOutput(event.testOutput);
        result.testsPassing = testsPassing;

        if (testsPassing) {
            // Run PostToolEdit pipeline (ESLint)
            const lintResult = await runPostToolEditPipeline([event.filePath]);
            if (lintResult.linted && lintResult.issues > 0) {
                console.log(`[TDD] Lint-on-green: ${lintResult.issues} issues found`);
            }
        }
    }

    // Record Git SHA
    try {
        result.gitSha = execSync("git rev-parse HEAD", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch {
        // Git may be unavailable
    }

    return result;
}
