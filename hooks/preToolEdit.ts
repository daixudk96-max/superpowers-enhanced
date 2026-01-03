import path from "node:path";
import fs from "node:fs";
import { loadConfig, hasApiKey } from "../lib/config-loader.js";
import { determineRiskTier, shouldBlockEdit } from "../lib/risk-validator.js";
import { isTestFile } from "../lib/language-adapter.js";
import { validateWithAI } from "../lib/api-client.js";
import { checkTestQuality } from "../lib/test-quality-checker.js";
import { runPreToolEditPipeline, type PipelineResult } from "../lib/pipeline.js";

export interface PreToolEditEvent {
    toolName: string;
    filePath: string;
    content?: string;
    hasFailingTest?: boolean;
    hasExemption?: boolean;
}

export interface PreToolEditResult {
    allowed: boolean;
    reason?: string;
    tier?: number;
    logged?: boolean;
    testQualityWarnings?: string[];
}

/**
 * Find the corresponding test file for a given source file.
 * Returns null if no test file is found.
 *
 * @example
 * findCorrespondingTestFile("src/utils/helper.ts") -> "src/utils/helper.test.ts"
 * findCorrespondingTestFile("lib/api-client.ts") -> "tests/api-client.test.ts"
 */
export function findCorrespondingTestFile(filePath: string): string | null {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    // Common test file patterns to check
    const testCandidates = [
        // Same directory patterns
        path.join(dir, `${base}.test${ext}`),
        path.join(dir, `${base}.spec${ext}`),
        // __tests__ directory pattern
        path.join(dir, "__tests__", `${base}.test${ext}`),
        path.join(dir, "__tests__", `${base}.spec${ext}`),
        // tests/ directory at project root
        path.join("tests", path.relative(".", dir), `${base}.test${ext}`),
        path.join("tests", `${base}.test${ext}`),
    ];

    for (const candidate of testCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

/**
 * PreToolEdit Hook - Intercepts file edits and enforces TDD based on Risk Tier.
 * Now async to support AI validation fallback.
 */
export async function preToolEdit(event: PreToolEditEvent): Promise<PreToolEditResult> {
    const config = loadConfig();
    const result: PreToolEditResult = { allowed: true };

    // Bypass if TDD validation is disabled
    if (!config.tdd.enabled) {
        return { allowed: true, reason: "TDD validation disabled" };
    }

    // Always allow test file edits (writing tests is always OK)
    if (isTestFile(event.filePath)) {
        return { allowed: true, reason: "Test file edits always allowed" };
    }

    // Determine Risk Tier
    const tier = determineRiskTier(event.filePath);

    // Tier 0: Always allowed, no logging
    if (tier.tier === 0) {
        return { allowed: true, tier: 0 };
    }

    // Tier 1: Allowed with logging
    if (tier.tier === 1) {
        console.log(`[TDD] Tier 1 edit logged: ${event.filePath}`);
        return { allowed: true, tier: 1, logged: true };
    }

    // Tier 2-3: Check if edit should be blocked
    // Derive effective exemption from both explicit flag and content comment
    const hasExemptionFromContent = event.content ? hasExemptionComment(event.content) : false;
    const effectiveHasExemption = event.hasExemption ?? hasExemptionFromContent;

    const blockResult = shouldBlockEdit(
        tier,
        event.hasFailingTest ?? false,
        effectiveHasExemption
    );

    if (blockResult.blocked) {
        // NEW: Try AI validation as a fallback before blocking
        if (config.tdd.client === "api" && hasApiKey(config)) {
            try {
                const aiResult = await validateWithAI({
                    context: `Tier ${tier.tier} edit without failing test`,
                    filePath: event.filePath,
                    content: event.content ?? "",
                });

                if (aiResult.decision === "approve") {
                    console.log(`[TDD] AI approved Tier ${tier.tier} edit: ${aiResult.reason}`);
                    return {
                        allowed: true,
                        tier: tier.tier,
                        reason: `AI approved: ${aiResult.reason}`,
                    };
                }
            } catch (error) {
                console.warn(`[TDD] AI validation failed, falling back to block: ${error}`);
            }
        }

        return {
            allowed: false,
            reason: blockResult.reason,
            tier: tier.tier,
        };
    }

    // NEW: Check corresponding test file quality when editing source code
    if (config.tdd.astChecks) {
        const testFilePath = findCorrespondingTestFile(event.filePath);
        if (testFilePath && fs.existsSync(testFilePath)) {
            try {
                const testContent = fs.readFileSync(testFilePath, "utf-8");
                const qualityResult = checkTestQuality(testContent, testFilePath, {
                    rejectEmptyTests: config.tdd.rejectEmptyTests,
                    rejectMissingAssertions: config.tdd.rejectMissingAssertions,
                    rejectTrivialAssertions: config.tdd.rejectTrivialAssertions,
                });

                if (!qualityResult.ok) {
                    result.testQualityWarnings = qualityResult.errors;
                    console.warn(`[TDD] Test quality issues in ${testFilePath}:`, qualityResult.errors);
                }
            } catch (error) {
                console.warn(`[TDD] Failed to check test quality: ${error}`);
            }
        }
    }

    return { ...result, tier: tier.tier };
}

/**
 * Check if content contains TDD-EXEMPT comment
 */
export function hasExemptionComment(content: string): boolean {
    return /<!--\s*TDD-EXEMPT:/.test(content) || /\/\/\s*TDD-EXEMPT:/.test(content);
}

/**
 * NEW: Pipeline-based PreToolEdit Hook
 * 
 * Uses the new modular pipeline architecture from tdd-guard integration.
 * This provides workflow-aware TDD enforcement with ignore patterns and lint integration.
 */
export async function preToolEditWithPipeline(event: PreToolEditEvent): Promise<PreToolEditResult> {
    // Always allow test file edits
    if (isTestFile(event.filePath)) {
        return { allowed: true, reason: "Test file edits always allowed" };
    }

    // Run the new pipeline
    const pipelineResult: PipelineResult = await runPreToolEditPipeline(event.filePath);

    // Log notifications
    for (const notification of pipelineResult.notifications) {
        console.log(notification);
    }

    // Convert pipeline result to PreToolEditResult
    if (pipelineResult.blocked) {
        return {
            allowed: false,
            reason: pipelineResult.reason,
        };
    }

    return {
        allowed: true,
        reason: pipelineResult.reason,
    };
}
