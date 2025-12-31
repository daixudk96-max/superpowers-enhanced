import { loadConfig } from "../lib/config-loader.js";
import { determineRiskTier, shouldBlockEdit } from "../lib/risk-validator.js";
import { isTestFile } from "../lib/language-adapter.js";

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
}

/**
 * PreToolEdit Hook - Intercepts file edits and enforces TDD based on Risk Tier
 */
export function preToolEdit(event: PreToolEditEvent): PreToolEditResult {
    const config = loadConfig();

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
    const blockResult = shouldBlockEdit(
        tier,
        event.hasFailingTest ?? false,
        event.hasExemption ?? false
    );

    if (blockResult.blocked) {
        return {
            allowed: false,
            reason: blockResult.reason,
            tier: tier.tier,
        };
    }

    return { allowed: true, tier: tier.tier };
}

/**
 * Check if content contains TDD-EXEMPT comment
 */
export function hasExemptionComment(content: string): boolean {
    return /<!--\s*TDD-EXEMPT:/.test(content) || /\/\/\s*TDD-EXEMPT:/.test(content);
}
