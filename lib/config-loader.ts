import dotenv from "dotenv";

dotenv.config();

export type Provider =
    | "anthropic"
    | "openrouter"
    | "google"
    | "openai-compatible";

export interface ProviderConfig {
    provider: Provider;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    projectId?: string; // Google Vertex
    location?: string; // Google Vertex
    credentialsPath?: string; // Google Vertex
}

export interface TddConfig {
    enabled: boolean;
    client: "sdk" | "api";
    astChecks: boolean;
    rejectEmptyTests: boolean;
    rejectMissingAssertions: boolean;
    rejectTrivialAssertions: boolean;
    // --- New fields for tdd-guard feature migration ---
    /** Linter to use after edits: "eslint" or "none" */
    linterType: "eslint" | "none";
    /** Run linter when tests pass (refactor phase) */
    lintOnGreen: boolean;
    /** Block edit if lint errors exist (after first notification) */
    lintBlock: boolean;
    /** Enable Risk Tier-based TDD enforcement */
    riskTierEnabled: boolean;
    /** Minimum tier that requires TDD enforcement (0-3) */
    minEnforceTier: number;
    /** Glob patterns for files to ignore (e.g., ["*.md", "*.json"]) */
    ignorePatterns: string[];
}

export interface RuntimeConfig {
    tdd: TddConfig;
    provider: ProviderConfig;
    fusionStateDir: string;
    logLevel: "debug" | "info" | "warn" | "error";
}

const env = process.env;

/** Default ignore patterns for files that don't require TDD */
const DEFAULT_IGNORE_PATTERNS = ["*.md", "*.json", "*.yml", "*.yaml", "*.css", "*.scss", "*.svg"];

/**
 * Parse comma-separated patterns from environment variable
 */
function parsePatterns(value: string | undefined): string[] {
    if (!value) return DEFAULT_IGNORE_PATTERNS;
    return value.split(",").map((p) => p.trim()).filter(Boolean);
}

/**
 * Load configuration from .env file with sensible defaults.
 * Priority: .env file > Environment variables > Hardcoded defaults
 */
export function loadConfig(): RuntimeConfig {
    const provider = (env.TDD_API_PROVIDER as Provider | undefined) ?? "anthropic";

    return {
        tdd: {
            enabled: env.TDD_VALIDATION_ENABLED !== "false",
            client: (env.TDD_VALIDATION_CLIENT as "sdk" | "api" | undefined) ?? "sdk",
            astChecks: env.TDD_AST_CHECKS_ENABLED !== "false",
            rejectEmptyTests: env.TDD_REJECT_EMPTY_TESTS !== "false",
            rejectMissingAssertions: env.TDD_REJECT_MISSING_ASSERTIONS !== "false",
            rejectTrivialAssertions: env.TDD_REJECT_TRIVIAL_ASSERTIONS !== "false",
            // --- New fields for tdd-guard feature migration ---
            linterType: (env.TDD_LINTER_TYPE as "eslint" | "none" | undefined) ?? "none",
            lintOnGreen: env.TDD_LINT_ON_GREEN !== "false",
            lintBlock: env.TDD_LINT_BLOCK === "true",
            riskTierEnabled: env.TDD_RISK_TIER_ENABLED !== "false",
            minEnforceTier: parseInt(env.TDD_MIN_ENFORCE_TIER ?? "2", 10),
            ignorePatterns: parsePatterns(env.TDD_IGNORE_PATTERNS),
        },
        provider: buildProviderConfig(provider),
        fusionStateDir: env.FUSION_STATE_DIR ?? ".fusion",
        logLevel: (env.LOG_LEVEL as RuntimeConfig["logLevel"]) ?? "info",
    };
}

function buildProviderConfig(provider: Provider): ProviderConfig {
    switch (provider) {
        case "anthropic":
            return {
                provider,
                apiKey: env.ANTHROPIC_API_KEY,
                baseUrl: env.ANTHROPIC_BASE_URL || undefined, // 空则使用官方默认
                model: env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022",
            };
        case "openrouter":
            return {
                provider,
                apiKey: env.OPENROUTER_API_KEY,
                baseUrl: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
                model: env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-haiku",
            };
        case "google":
            return {
                provider,
                apiKey: env.GOOGLE_API_KEY,
                baseUrl: env.GOOGLE_BASE_URL || undefined, // 空则使用官方默认
                model: env.GOOGLE_MODEL ?? "gemini-2.0-flash-exp",
                projectId: env.GOOGLE_VERTEX_PROJECT_ID,
                location: env.GOOGLE_VERTEX_LOCATION,
                credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS,
            };
        case "openai-compatible":
            return {
                provider,
                apiKey: env.OPENAI_API_KEY,
                baseUrl: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
                model: env.OPENAI_MODEL ?? "gpt-4o-mini",
            };
    }
}

/**
 * Check if API key is available for current provider
 */
export function hasApiKey(config: RuntimeConfig): boolean {
    return !!config.provider.apiKey;
}
