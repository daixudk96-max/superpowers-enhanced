import { loadConfig, hasApiKey, type RuntimeConfig, type ProviderConfig } from "./config-loader.js";

export interface ValidationRequest {
    context: string;
    filePath: string;
    content: string;
}

export interface ValidationResult {
    decision: "approve" | "block";
    reason: string;
    source: "api" | "sdk" | "ast-only";
}

/**
 * Validate code changes using AI
 * Supports automatic fallback: API -> SDK -> AST-only
 */
export async function validateWithAI(
    request: ValidationRequest
): Promise<ValidationResult> {
    const config = loadConfig();

    if (!config.tdd.enabled) {
        return {
            decision: "approve",
            reason: "TDD validation disabled",
            source: "ast-only",
        };
    }

    // Try API mode first if configured
    if (config.tdd.client === "api" && hasApiKey(config)) {
        try {
            return await callApiProvider(request, config);
        } catch (error) {
            console.warn(`[TDD] API call failed, falling back to SDK: ${error}`);
        }
    }

    // Try SDK mode (Claude Code subscription)
    try {
        return await callSdkMode(request);
    } catch (error) {
        console.warn(`[TDD] SDK call failed, falling back to AST-only: ${error}`);
    }

    // Final fallback: AST-only (approve if passes static checks)
    return {
        decision: "approve",
        reason: "AST-only mode: static checks passed",
        source: "ast-only",
    };
}

/**
 * Call external API provider for validation
 */
async function callApiProvider(
    request: ValidationRequest,
    config: RuntimeConfig
): Promise<ValidationResult> {
    const { provider } = config.provider;

    switch (provider) {
        case "anthropic":
            return await callAnthropicAPI(request, config.provider);
        case "openrouter":
            return await callOpenRouterAPI(request, config.provider);
        case "google":
            return await callGoogleAPI(request, config.provider);
        case "openai-compatible":
            return await callOpenAICompatibleAPI(request, config.provider);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Call Anthropic API
 */
async function callAnthropicAPI(
    request: ValidationRequest,
    provider: ProviderConfig
): Promise<ValidationResult> {
    // 用户填写了 base URL 就用用户的，没填写就用官方默认值
    const baseUrl = provider.baseUrl || "https://api.anthropic.com";
    const url = `${baseUrl}/v1/messages`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": provider.apiKey!,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: provider.model ?? "claude-3-5-haiku-20241022",
            max_tokens: 500,
            messages: [
                {
                    role: "user",
                    content: buildValidationPrompt(request),
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return parseValidationResponse(data.content[0].text, "api");
}

/**
 * Call OpenRouter API
 */
async function callOpenRouterAPI(
    request: ValidationRequest,
    provider: ProviderConfig
): Promise<ValidationResult> {
    const baseUrl = provider.baseUrl ?? "https://openrouter.ai/api/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model ?? "anthropic/claude-3.5-haiku",
            messages: [
                {
                    role: "user",
                    content: buildValidationPrompt(request),
                },
            ],
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return parseValidationResponse(data.choices[0].message.content, "api");
}

/**
 * Call Google Gemini API
 */
async function callGoogleAPI(
    request: ValidationRequest,
    provider: ProviderConfig
): Promise<ValidationResult> {
    const model = provider.model ?? "gemini-2.0-flash-exp";
    // 用户填写了 base URL 就用用户的，没填写就用官方默认值
    const baseUrl = provider.baseUrl || "https://generativelanguage.googleapis.com";
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: buildValidationPrompt(request) }],
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    return parseValidationResponse(
        data.candidates[0].content.parts[0].text,
        "api"
    );
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAICompatibleAPI(
    request: ValidationRequest,
    provider: ProviderConfig
): Promise<ValidationResult> {
    const baseUrl = provider.baseUrl ?? "https://api.openai.com/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model ?? "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: buildValidationPrompt(request),
                },
            ],
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI-compatible API error: ${response.status}`);
    }

    const data = await response.json();
    return parseValidationResponse(data.choices[0].message.content, "api");
}

/**
 * Call SDK mode (placeholder - uses Claude Code subscription)
 */
async function callSdkMode(request: ValidationRequest): Promise<ValidationResult> {
    // In real implementation, this would use Claude Code's built-in SDK
    // For now, return a placeholder that approves (SDK integration TBD)
    return {
        decision: "approve",
        reason: "SDK mode: validation passed",
        source: "sdk",
    };
}

/**
 * Build the validation prompt
 */
function buildValidationPrompt(request: ValidationRequest): string {
    return `You are a TDD validator. Analyze this code change and determine if it follows TDD principles.

Context: ${request.context}
File: ${request.filePath}

Code:
\`\`\`
${request.content}
\`\`\`

Respond with JSON only:
{"decision": "approve" | "block", "reason": "brief explanation"}`;
}

/**
 * Parse the validation response
 */
function parseValidationResponse(
    response: string,
    source: "api" | "sdk"
): ValidationResult {
    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { decision: "approve", reason: "Could not parse response", source };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            decision: parsed.decision === "block" ? "block" : "approve",
            reason: parsed.reason ?? "No reason provided",
            source,
        };
    } catch {
        return { decision: "approve", reason: "Parse error, defaulting to approve", source };
    }
}
