/**
 * Lint Notifier - Track lint notification state for first-warn-then-block
 *
 * Implements the "first notification, then block" pattern from tdd-guard:
 * 1. First time lint issues are found: Show warning, don't block
 * 2. Subsequent edits with same issues: Block until fixed
 *
 * Uses .fusion/lint-results.json to track hasNotifiedAboutLintIssues flag.
 */

import { FileStorage, type Storage } from "./storage.js";
import { LintResultSchema, type LintResult } from "./schemas.js";

export interface LintNotificationResult {
    /** Whether to block the current operation */
    shouldBlock: boolean;
    /** Whether to show a notification to the user */
    shouldNotify: boolean;
    /** Reason for the decision */
    reason?: string;
    /** Human-readable message for the user */
    message?: string;
}

/**
 * Check lint notification state and determine action
 * 
 * @param filePath - File being edited
 * @param storage - Optional storage implementation
 */
export async function checkLintNotification(
    filePath: string,
    storage?: Storage
): Promise<LintNotificationResult> {
    const store = storage ?? new FileStorage();

    // Read current lint results
    const raw = await store.getLint();
    if (!raw) {
        return {
            shouldBlock: false,
            shouldNotify: false,
            reason: "No lint results found",
        };
    }

    let lintResult: LintResult;
    try {
        lintResult = LintResultSchema.parse(JSON.parse(raw));
    } catch {
        return {
            shouldBlock: false,
            shouldNotify: false,
            reason: "Failed to parse lint results",
        };
    }

    // Check if there are any errors
    if (lintResult.errorCount === 0) {
        return {
            shouldBlock: false,
            shouldNotify: false,
            reason: "No lint errors",
        };
    }

    // Check if any issues are for the current file
    const fileIssues = lintResult.issues.filter((issue) =>
        issue.file.endsWith(filePath) || filePath.endsWith(issue.file)
    );

    if (fileIssues.length === 0) {
        return {
            shouldBlock: false,
            shouldNotify: false,
            reason: "No lint issues for this file",
        };
    }

    // First-warn-then-block logic
    if (lintResult.hasNotifiedAboutLintIssues) {
        // Already notified, now block
        return {
            shouldBlock: true,
            shouldNotify: false,
            reason: "Lint issues persist after notification",
            message: `[TDD] ❌ Blocked: ${lintResult.errorCount} lint errors must be fixed before editing.`,
        };
    } else {
        // First time seeing issues, notify and mark
        await markLintNotified(store);
        return {
            shouldBlock: false,
            shouldNotify: true,
            reason: "First notification about lint issues",
            message: `[TDD] ⚠️ Warning: ${lintResult.errorCount} lint errors found. Please fix before next edit.`,
        };
    }
}

/**
 * Mark that user has been notified about lint issues
 */
async function markLintNotified(storage: Storage): Promise<void> {
    const raw = await storage.getLint();
    if (!raw) return;

    try {
        const lintResult = LintResultSchema.parse(JSON.parse(raw));
        lintResult.hasNotifiedAboutLintIssues = true;
        await storage.saveLint(JSON.stringify(lintResult, null, 2));
    } catch {
        // Ignore parse errors
    }
}

/**
 * Clear lint notification state (call after issues are fixed)
 */
export async function clearLintNotification(storage?: Storage): Promise<void> {
    const store = storage ?? new FileStorage();
    const raw = await store.getLint();
    if (!raw) return;

    try {
        const lintResult = LintResultSchema.parse(JSON.parse(raw));
        lintResult.hasNotifiedAboutLintIssues = false;
        await store.saveLint(JSON.stringify(lintResult, null, 2));
    } catch {
        // Ignore parse errors
    }
}
