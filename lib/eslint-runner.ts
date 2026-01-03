/**
 * ESLint Runner - Execute ESLint and parse results
 *
 * Runs ESLint on specified files and converts output to LintResult format.
 * Persists results to .fusion/lint-results.json via Storage.
 *
 * Adapted from tdd-guard/src/linters/eslint/ESLint.ts (83 lines)
 */

import { exec } from "child_process";
import { FileStorage, type Storage } from "./storage.js";
import { type LintIssue, type LintResult } from "./schemas.js";

/** ESLint JSON output message format */
interface ESLintJSONMessage {
    ruleId: string | null;
    severity: number;
    message: string;
    line: number;
    column: number;
    fatal?: boolean;
}

/** ESLint JSON output file result format */
interface ESLintJSONResult {
    filePath: string;
    messages: ESLintJSONMessage[];
    errorCount: number;
    warningCount: number;
}

/**
 * Build ESLint command with JSON formatter
 */
function buildCommand(files: string[]): string {
    const quoted = files.map((file) => `"${file}"`).join(" ");
    return `npx eslint --format json ${quoted}`;
}

/**
 * Execute ESLint and return raw output
 * 
 * Note: ESLint exits with code 1 when there are lint errors,
 * so we need to handle this case specially.
 */
function execESLint(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            // ESLint outputs JSON even when there are errors
            if (stdout && stdout.trim().length > 0) {
                resolve(stdout);
                return;
            }
            if (error) {
                // If stderr has content, it might be a real error
                if (stderr && stderr.trim().length > 0) {
                    reject(new Error(stderr));
                    return;
                }
                // Otherwise, ESLint just found issues
                reject(error);
                return;
            }
            reject(new Error("ESLint produced no output"));
        });
    });
}

/**
 * Run ESLint on specified files
 * 
 * @param files - Array of file paths to lint
 * @param storage - Optional storage implementation
 * @returns LintResult with all issues found
 */
export async function runESLint(files: string[], storage?: Storage): Promise<LintResult> {
    const store = storage ?? new FileStorage();

    // Handle empty files list
    if (files.length === 0) {
        const emptyResult: LintResult = {
            timestamp: new Date().toISOString(),
            files: [],
            issues: [],
            errorCount: 0,
            warningCount: 0,
        };
        await store.saveLint(JSON.stringify(emptyResult, null, 2));
        return emptyResult;
    }

    const command = buildCommand(files);
    let stdout: string;

    try {
        stdout = await execESLint(command);
    } catch (error) {
        // ESLint not installed or other execution error
        console.warn("[ESLintRunner] Failed to execute ESLint:", error);
        const errorResult: LintResult = {
            timestamp: new Date().toISOString(),
            files,
            issues: [{
                file: files[0],
                line: 0,
                column: 0,
                severity: "error",
                message: `ESLint execution failed: ${String(error)}`,
            }],
            errorCount: 1,
            warningCount: 0,
        };
        await store.saveLint(JSON.stringify(errorResult, null, 2));
        return errorResult;
    }

    // Parse ESLint JSON output
    let parsed: ESLintJSONResult[] = [];
    try {
        parsed = JSON.parse(stdout);
    } catch (parseError) {
        throw new Error(`Failed to parse ESLint JSON output: ${String(parseError)}`);
    }

    // Convert to LintResult format
    const issues: LintIssue[] = [];
    let errorCount = 0;
    let warningCount = 0;

    for (const fileResult of parsed) {
        for (const message of fileResult.messages) {
            const severity = message.severity === 2 || message.fatal ? "error" : "warning";
            if (severity === "error") {
                errorCount += 1;
            } else {
                warningCount += 1;
            }

            issues.push({
                file: fileResult.filePath,
                line: message.line ?? 0,
                column: message.column ?? 0,
                severity,
                message: message.message,
                rule: message.ruleId ?? undefined,
            });
        }
    }

    const lintResult: LintResult = {
        timestamp: new Date().toISOString(),
        files: parsed.map((p) => p.filePath),
        issues,
        errorCount,
        warningCount,
    };

    // Persist results
    await store.saveLint(JSON.stringify(lintResult, null, 2));

    // Log summary
    if (errorCount > 0 || warningCount > 0) {
        console.log(`[ESLintRunner] Found ${errorCount} errors, ${warningCount} warnings`);
    }

    return lintResult;
}

/**
 * Check if ESLint is available in the project
 */
export async function isESLintAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        exec("npx eslint --version", (error) => {
            resolve(!error);
        });
    });
}
