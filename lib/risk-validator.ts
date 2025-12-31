export type RiskTier = 0 | 1 | 2 | 3;

export interface RiskTierResult {
    tier: RiskTier;
    requiresTest: boolean;
    allowsExemption: boolean;
    description: string;
}

/**
 * File extensions/patterns for each Risk Tier
 */
const TIER_0_PATTERNS = [
    /\.md$/i,
    /\.txt$/i,
    /\.gitignore$/i,
    /\.editorconfig$/i,
    /README/i,
    /LICENSE/i,
    /CHANGELOG/i,
];

const TIER_1_PATTERNS = [
    /\.css$/i,
    /\.scss$/i,
    /\.less$/i,
    /\.json$/i, // config files
    /\.yaml$/i,
    /\.yml$/i,
    /\.toml$/i,
];

const TIER_3_PATTERNS = [
    /\/api\//i,
    /\/routes\//i,
    /\/controllers\//i,
    /\/services\//i,
    /\/models\//i,
    /\/db\//i,
    /\/database\//i,
    /\/auth\//i,
    /\/security\//i,
];

/**
 * Determine Risk Tier for a given file path
 */
export function determineRiskTier(filePath: string): RiskTierResult {
    // Check Tier 0 (always allowed)
    if (TIER_0_PATTERNS.some((p) => p.test(filePath))) {
        return {
            tier: 0,
            requiresTest: false,
            allowsExemption: false,
            description: "Always allowed (docs, config)",
        };
    }

    // Check Tier 1 (allowed with logging)
    if (TIER_1_PATTERNS.some((p) => p.test(filePath))) {
        return {
            tier: 1,
            requiresTest: false,
            allowsExemption: false,
            description: "Allowed with logging (styles, config)",
        };
    }

    // Check Tier 3 (strict TDD)
    if (TIER_3_PATTERNS.some((p) => p.test(filePath))) {
        return {
            tier: 3,
            requiresTest: true,
            allowsExemption: false,
            description: "Strict TDD required (core logic)",
        };
    }

    // Default to Tier 2 (test or exemption)
    return {
        tier: 2,
        requiresTest: true,
        allowsExemption: true,
        description: "Test or exemption required",
    };
}

/**
 * Check if an edit should be blocked based on Risk Tier and test status
 */
export function shouldBlockEdit(
    tier: RiskTierResult,
    hasFailingTest: boolean,
    hasExemption: boolean
): { blocked: boolean; reason?: string } {
    // Tier 0-1: Never block
    if (tier.tier <= 1) {
        return { blocked: false };
    }

    // Tier 2: Block if no test AND no exemption
    if (tier.tier === 2) {
        if (!hasFailingTest && !hasExemption) {
            return {
                blocked: true,
                reason: "Tier 2: Requires failing test or TDD-EXEMPT comment",
            };
        }
        return { blocked: false };
    }

    // Tier 3: Block if no failing test (exemption not allowed)
    if (tier.tier === 3) {
        if (!hasFailingTest) {
            return {
                blocked: true,
                reason: "Tier 3: Strict TDD - must have failing test first",
            };
        }
        return { blocked: false };
    }

    return { blocked: false };
}
