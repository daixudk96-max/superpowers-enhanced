/**
 * TOML Prompt Loader
 *
 * Loads and parses TOML prompt configuration files from the prompts/conductor directory.
 * Used to load Conductor command prompts for interactive workflows.
 */
import fs from "node:fs";
import path from "node:path";
import TOML from "@ltd/j-toml";

/**
 * Configuration structure for a prompt loaded from TOML
 */
export interface PromptConfig {
    /** Brief description of the command */
    description: string;
    /** Full prompt text for the AI agent */
    prompt: string;
}

/**
 * Get the directory containing Conductor prompt files
 */
function getPromptsDir(): string {
    return path.resolve(process.cwd(), "prompts", "conductor");
}

/**
 * Assert that a field is a non-empty string
 */
function assertStringField(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Invalid or missing "${field}" in prompt TOML`);
    }
    return value;
}

/**
 * Load a prompt configuration by command name.
 *
 * @param commandName - The name of the command (e.g., "setup", "implement")
 * @returns The parsed prompt configuration
 * @throws If the file doesn't exist or is missing required fields
 *
 * @example
 * ```ts
 * const config = loadPrompt("setup");
 * console.log(config.description); // "Scaffolds the project..."
 * console.log(config.prompt);      // Full prompt text
 * ```
 */
export function loadPrompt(commandName: string): PromptConfig {
    // Security: validate command name to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(commandName)) {
        throw new Error(`Invalid command name: ${commandName}`);
    }

    const promptsDir = getPromptsDir();
    const filePath = path.join(promptsDir, `${commandName}.toml`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Prompt file not found for command: ${commandName}`);
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Parse TOML with multiline string support
    const parsed = TOML.parse(content, {
        joiner: "\n",
        bigint: false,
    }) as Record<string, unknown>;

    return {
        description: assertStringField(parsed.description, "description"),
        prompt: assertStringField(parsed.prompt, "prompt"),
    };
}

/**
 * Check if a prompt file exists for a given command
 *
 * @param commandName - The name of the command
 * @returns true if the prompt file exists
 */
export function hasPrompt(commandName: string): boolean {
    const promptsDir = getPromptsDir();
    const filePath = path.join(promptsDir, `${commandName}.toml`);
    return fs.existsSync(filePath);
}

/**
 * List all available prompt command names
 *
 * @returns Array of command names (without .toml extension)
 */
export function listPrompts(): string[] {
    const promptsDir = getPromptsDir();

    if (!fs.existsSync(promptsDir)) {
        return [];
    }

    return fs
        .readdirSync(promptsDir)
        .filter((file) => file.endsWith(".toml"))
        .map((file) => file.replace(/\.toml$/, ""));
}
