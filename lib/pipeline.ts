/**
 * TDD Pipeline - Orchestrated check pipeline for edit operations
 *
 * Implements the PreToolEdit and PostToolEdit pipelines as described in the
 * proposal. Each step in the pipeline can:
 * - Pass (continue to next step)
 * - Block (stop edit with error message)
 * - Notify (show warning but continue)
 */

import { loadConfig, type RuntimeConfig } from "./config-loader.js";
import { GuardManager } from "./guard-manager.js";
import { checkTestStatus, type TestStatusResult } from "./test-status-checker.js";
import { checkLintNotification, type LintNotificationResult } from "./lint-notifier.js";
import { runESLint, isESLintAvailable } from "./eslint-runner.js";
import { WorkflowMiddleware, type WorkflowPhase } from "./workflow-middleware.js";
import { checkTestQuality, type TestQualityResult } from "./test-quality-checker.js";
import { determineRiskTier } from "./risk-validator.js";

export interface PipelineContext {
    /** File being edited */
    filePath: string;
    /** Risk tier (0-3) */
    tier: number;
    /** Current workflow phase */
    phase: WorkflowPhase;
    /** Runtime config */
    config: RuntimeConfig;
}

export interface PipelineResult {
    /** Whether edit should be blocked */
    blocked: boolean;
    /** Human-readable reason */
    reason: string;
    /** All warnings/notifications collected */
    notifications: string[];
    /** Which step caused the block (if blocked) */
    blockedBy?: string;
}

export interface PipelineStep {
    name: string;
    run: (ctx: PipelineContext, result: PipelineResult) => Promise<void>;
}

// ============================================================================
// PreToolEdit Pipeline
// ============================================================================

/**
 * Step 1: Check if guard is enabled
 */
const guardToggleStep: PipelineStep = {
    name: "guardToggle",
    async run(_ctx, result) {
        const guard = new GuardManager();
        const enabled = await guard.isEnabled();
        if (!enabled) {
            result.blocked = false;
            result.reason = "TDD Guard disabled";
            result.blockedBy = "guardToggle (skip pipeline)";
        }
    },
};

/**
 * Step 2: Check ignore patterns
 */
const ignorePatternsStep: PipelineStep = {
    name: "ignorePatterns",
    async run(ctx, result) {
        if (result.blockedBy) return; // Skip if already decided

        const guard = new GuardManager();
        const shouldIgnore = await guard.shouldIgnoreFile(ctx.filePath);
        if (shouldIgnore) {
            result.blocked = false;
            result.reason = `File matches ignore pattern: ${ctx.filePath}`;
            result.blockedBy = "ignorePatterns (skip)";
        }
    },
};

/**
 * Step 3: Check risk tier
 */
const riskTierStep: PipelineStep = {
    name: "riskTier",
    async run(ctx, result) {
        if (result.blockedBy) return;

        // Tier 0: Always pass
        if (ctx.tier === 0) {
            result.blocked = false;
            result.reason = "Tier 0: Documentation, no TDD required";
            result.blockedBy = "riskTier (Tier 0)";
            return;
        }

        // Tier 1: Log but pass
        if (ctx.tier === 1) {
            result.notifications.push(`[TDD] Tier 1: Style/config file, TDD recommended`);
            result.blockedBy = "riskTier (Tier 1)";
            return;
        }

        // Tier 2-3: Continue to test checks
    },
};

/**
 * Step 4: Check workflow phase
 */
const workflowPhaseStep: PipelineStep = {
    name: "workflowPhase",
    async run(ctx, result) {
        if (result.blockedBy) return;

        const middleware = new WorkflowMiddleware();
        const shouldEnforce = await middleware.shouldEnforceTdd();

        if (!shouldEnforce) {
            result.blocked = false;
            result.reason = `Workflow phase '${ctx.phase}' does not require TDD`;
            result.blockedBy = "workflowPhase (no TDD)";
        }
    },
};

/**
 * Step 5: Check test status
 */
const testStatusStep: PipelineStep = {
    name: "testStatus",
    async run(ctx, result) {
        if (result.blockedBy) return;

        const testResult: TestStatusResult = await checkTestStatus(ctx.filePath, ctx.tier);

        if (testResult.blocked) {
            result.blocked = true;
            result.reason = testResult.reason;
            result.blockedBy = "testStatus";
        } else if (testResult.summary) {
            result.notifications.push(
                `[TDD] Tests: ${testResult.summary.passed} passed, ${testResult.summary.failed} failed`
            );
        }
    },
};

/**
 * Step 6: Check test quality (AST)
 */
const astQualityStep: PipelineStep = {
    name: "astQuality",
    async run(ctx, result) {
        if (result.blockedBy) return;
        if (!ctx.config.tdd.astChecks) return;

        // Only check if we have a test file
        const isTestFile = ctx.filePath.includes(".test.") || ctx.filePath.includes(".spec.");
        if (!isTestFile) return;

        // Read file content for AST analysis
        let content: string;
        try {
            const fs = await import("fs/promises");
            content = await fs.readFile(ctx.filePath, "utf-8");
        } catch {
            // File doesn't exist or can't be read - skip quality check
            return;
        }

        const qualityResult: TestQualityResult = checkTestQuality(content, ctx.filePath, {
            rejectEmptyTests: ctx.config.tdd.rejectEmptyTests,
            rejectMissingAssertions: ctx.config.tdd.rejectMissingAssertions,
            rejectTrivialAssertions: ctx.config.tdd.rejectTrivialAssertions,
        });

        if (!qualityResult.ok) {
            result.blocked = true;
            result.reason = qualityResult.errors.join("; ");
            result.blockedBy = "astQuality";
        } else if (qualityResult.warnings.length > 0) {
            result.notifications.push(...qualityResult.warnings);
        }
    },
};

/**
 * Step 7: Check lint notification state
 */
const lintNotificationStep: PipelineStep = {
    name: "lintNotification",
    async run(ctx, result) {
        if (result.blockedBy) return;
        if (ctx.config.tdd.linterType === "none") return;
        if (!ctx.config.tdd.lintBlock) return;

        const lintResult: LintNotificationResult = await checkLintNotification(ctx.filePath);

        if (lintResult.shouldBlock) {
            result.blocked = true;
            result.reason = lintResult.message ?? "Lint issues must be fixed";
            result.blockedBy = "lintNotification";
        } else if (lintResult.shouldNotify && lintResult.message) {
            result.notifications.push(lintResult.message);
        }
    },
};

/** PreToolEdit pipeline steps in order */
const PRE_TOOL_EDIT_STEPS: PipelineStep[] = [
    guardToggleStep,
    ignorePatternsStep,
    riskTierStep,
    workflowPhaseStep,
    testStatusStep,
    astQualityStep,
    lintNotificationStep,
];

/**
 * Run PreToolEdit pipeline
 */
export async function runPreToolEditPipeline(filePath: string): Promise<PipelineResult> {
    const config = loadConfig();
    const riskResult = determineRiskTier(filePath);
    const tier = riskResult.tier;
    const middleware = new WorkflowMiddleware();
    const phase = await middleware.getCurrentPhase();

    const ctx: PipelineContext = {
        filePath,
        tier,
        phase,
        config,
    };

    const result: PipelineResult = {
        blocked: false,
        reason: "All checks passed",
        notifications: [],
    };

    // Run each step in sequence
    for (const step of PRE_TOOL_EDIT_STEPS) {
        await step.run(ctx, result);

        // Stop if blocked
        if (result.blocked) {
            break;
        }

        // Stop if a step decided to skip the rest
        if (result.blockedBy && !result.blocked) {
            break;
        }
    }

    return result;
}

// ============================================================================
// PostToolEdit Pipeline
// ============================================================================

/**
 * Run ESLint after successful edit (if configured)
 */
export async function runPostToolEditPipeline(
    editedFiles: string[]
): Promise<{ linted: boolean; issues: number }> {
    const config = loadConfig();

    // Skip if linting disabled
    if (config.tdd.linterType === "none") {
        return { linted: false, issues: 0 };
    }

    // Skip if ESLint not available
    const available = await isESLintAvailable();
    if (!available) {
        console.log("[Pipeline] ESLint not available, skipping lint");
        return { linted: false, issues: 0 };
    }

    // Filter to lintable files
    const lintableExtensions = [".ts", ".tsx", ".js", ".jsx"];
    const lintableFiles = editedFiles.filter((f) =>
        lintableExtensions.some((ext) => f.endsWith(ext))
    );

    if (lintableFiles.length === 0) {
        return { linted: false, issues: 0 };
    }

    // Run ESLint
    const lintResult = await runESLint(lintableFiles);

    return {
        linted: true,
        issues: lintResult.errorCount + lintResult.warningCount,
    };
}
