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
}

export interface RuntimeConfig {
    tdd: TddConfig;
    provider: ProviderConfig;
    fusionStateDir: string;
    logLevel: "debug" | "info" | "warn" | "error";
}

const env = process.env;

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
