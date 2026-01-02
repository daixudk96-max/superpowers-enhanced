import fs from "node:fs";
import path from "node:path";
import { loadConfig, hasApiKey, type RuntimeConfig, type ProviderConfig } from "./config-loader.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface DocSyncOptions {
    changeDir: string;
    contextDir: string;
}

export interface DocUpdate {
    targetFile: string;
    reason: string;
    originalContent: string;
    updatedContent: string;
}

interface ChangeDocs {
    proposal: string;
    specs: string;
}

interface ContextDoc {
    file: string;
    path: string;
    content: string | null;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Synchronize context documents based on change proposal.
 * Reads change directory docs, context docs, calls LLM for analysis,
 * and returns suggested updates.
 */
export async function syncContextDocs(options: DocSyncOptions): Promise<DocUpdate[]> {
    const config = loadConfig();

    if (!hasApiKey(config)) {
        console.warn("[doc-sync] No API key configured; skipping document sync.");
        return [];
    }

    const changeDocs = collectChangeDocs(options.changeDir);
    if (!changeDocs.proposal) {
        console.warn("[doc-sync] No proposal.md found; skipping document sync.");
        return [];
    }

    const contextDocs = snapshotContextDocs(options.contextDir);
    const prompt = buildDocSyncPrompt(changeDocs, contextDocs);

    let rawResponse: string;
    try {
        rawResponse = await callDocSyncProvider(prompt, config);
    } catch (error) {
        console.warn(`[doc-sync] LLM call failed: ${error}`);
        return [];
    }

    const updates = parseDocUpdates(rawResponse, contextDocs);
    return updates.filter(
        (update) => normalizeContent(update.originalContent) !== normalizeContent(update.updatedContent)
    );
}

// ============================================================================
// Document Collection
// ============================================================================

function collectChangeDocs(changeDir: string): ChangeDocs {
    const proposalPath = path.join(changeDir, "proposal.md");
    const specsDir = path.join(changeDir, "specs");

    const proposal = readFileSafe(proposalPath);
    let specs = "";

    if (fs.existsSync(specsDir) && fs.statSync(specsDir).isDirectory()) {
        const specFiles = collectSpecFiles(specsDir);
        specs = specFiles.map((f) => `### ${path.basename(f)}\n${readFileSafe(f)}`).join("\n\n");
    }

    return { proposal, specs };
}

function collectSpecFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectSpecFiles(fullPath));
        } else if (entry.name.endsWith(".md")) {
            results.push(fullPath);
        }
    }

    return results;
}

function snapshotContextDocs(contextDir: string): ContextDoc[] {
    const contextFiles = ["product.md", "tech-stack.md", "workflow.md"];

    return contextFiles.map((file) => {
        const filePath = path.join(contextDir, file);
        return {
            file,
            path: filePath,
            content: fs.existsSync(filePath) ? readFileSafe(filePath) : null,
        };
    });
}

// ============================================================================
// LLM Integration
// ============================================================================

function buildDocSyncPrompt(changeDocs: ChangeDocs, contextDocs: ContextDoc[]): string {
    const contextSection = contextDocs
        .filter((doc) => doc.content !== null)
        .map((doc) => `### ${doc.file}\n\`\`\`markdown\n${doc.content}\n\`\`\``)
        .join("\n\n");

    return `You are a documentation synchronization assistant. Analyze the following change proposal and determine if any context documents need to be updated.

## Change Proposal
\`\`\`markdown
${changeDocs.proposal}
\`\`\`

${changeDocs.specs ? `## Spec Changes\n${changeDocs.specs}` : ""}

## Current Context Documents
${contextSection}

## Instructions
1. Analyze the change proposal and specs
2. Determine which context documents (product.md, tech-stack.md, workflow.md) need updates
3. Only suggest updates if there are meaningful changes (new features, tech stack changes, workflow changes)
4. Preserve the existing document structure and formatting

## Response Format
Return a JSON array with updates needed. Each update should have:
- targetFile: the filename (e.g., "product.md")
- reason: brief explanation of why this update is needed
- updatedContent: the complete updated document content

If no updates are needed, return an empty array: []

Example:
[
  {
    "targetFile": "product.md",
    "reason": "Added new authentication feature to Core Features",
    "updatedContent": "# Product Context\\n\\n## Name\\n..."
  }
]

Respond with valid JSON only, no markdown code blocks.`;
}

async function callDocSyncProvider(prompt: string, config: RuntimeConfig): Promise<string> {
    const { provider } = config.provider;
    const providerConfig = config.provider;

    switch (provider) {
        case "anthropic":
            return await callAnthropicForDocSync(prompt, providerConfig);
        case "google":
            return await callGoogleForDocSync(prompt, providerConfig);
        case "openrouter":
            return await callOpenRouterForDocSync(prompt, providerConfig);
        case "openai-compatible":
            return await callOpenAICompatibleForDocSync(prompt, providerConfig);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

async function callAnthropicForDocSync(prompt: string, provider: ProviderConfig): Promise<string> {
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
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

async function callGoogleForDocSync(prompt: string, provider: ProviderConfig): Promise<string> {
    const model = provider.model ?? "gemini-2.0-flash-exp";
    const baseUrl = provider.baseUrl || "https://generativelanguage.googleapis.com";
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOpenRouterForDocSync(prompt: string, provider: ProviderConfig): Promise<string> {
    const baseUrl = provider.baseUrl ?? "https://openrouter.ai/api/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model ?? "anthropic/claude-3.5-haiku",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function callOpenAICompatibleForDocSync(prompt: string, provider: ProviderConfig): Promise<string> {
    const baseUrl = provider.baseUrl ?? "https://api.openai.com/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model ?? "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI-compatible API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ============================================================================
// Response Parsing
// ============================================================================

function parseDocUpdates(rawResponse: string, contextDocs: ContextDoc[]): DocUpdate[] {
    const contextMap = new Map(contextDocs.map((doc) => [doc.file, doc.content ?? ""]));

    try {
        const jsonStr = extractJsonArray(rawResponse);
        if (!jsonStr) {
            console.warn("[doc-sync] No JSON array found in response");
            return [];
        }

        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter(
                (item): item is { targetFile: string; updatedContent: string; reason?: string } =>
                    typeof item?.targetFile === "string" && typeof item?.updatedContent === "string"
            )
            .map((item) => ({
                targetFile: item.targetFile,
                reason: typeof item.reason === "string" ? item.reason : "Update suggested by doc sync",
                originalContent: contextMap.get(item.targetFile) ?? "",
                updatedContent: item.updatedContent,
            }));
    } catch (error) {
        console.warn(`[doc-sync] Failed to parse LLM response: ${error}`);
        return [];
    }
}

function extractJsonArray(text: string): string | null {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? match[0] : null;
}

// ============================================================================
// Diff Formatting
// ============================================================================

/**
 * Generate unified diff output for all updates.
 */
export function formatDiffs(updates: DocUpdate[]): string {
    if (updates.length === 0) {
        return "";
    }

    return updates.map((update) => createUnifiedDiff(update.targetFile, update.originalContent, update.updatedContent)).join("\n\n");
}

function createUnifiedDiff(targetFile: string, original: string, updated: string): string {
    const oldLines = original.replace(/\r\n/g, "\n").split("\n");
    const newLines = updated.replace(/\r\n/g, "\n").split("\n");

    const header = [
        `--- a/${targetFile}`,
        `+++ b/${targetFile}`,
        `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ];

    const body = [
        ...oldLines.map((line) => `-${line}`),
        ...newLines.map((line) => `+${line}`),
    ];

    return [...header, ...body].join("\n");
}

// ============================================================================
// Update Application
// ============================================================================

/**
 * Apply document updates to disk.
 */
export function applyDocUpdates(updates: DocUpdate[], contextDir: string): void {
    for (const update of updates) {
        const targetPath = path.join(contextDir, update.targetFile);
        fs.writeFileSync(targetPath, update.updatedContent, "utf8");
        console.log(`[doc-sync] Updated: ${update.targetFile}`);
    }
}

// ============================================================================
// Utilities
// ============================================================================

function readFileSafe(filePath: string): string {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch {
        return "";
    }
}

function normalizeContent(content: string): string {
    return content.replace(/\r\n/g, "\n").trim();
}
