/**
 * User Prompt Handler - Process TDD commands from chat dialog
 *
 * Handles commands like "tdd on", "tdd off" from user prompts.
 * This enables interactive control of TDD guard during chat sessions.
 *
 * Adapted from tdd-guard/src/hooks/userPromptHandler.ts (55 lines)
 */

import { GuardManager } from "../../lib/guard-manager.js";

/** Commands that enable TDD guard */
const TDD_ON_COMMANDS = [
    "tdd on",
    "tdd-guard on",
    "fusion tdd on",
    "enable tdd",
    "/tdd on",
];

/** Commands that disable TDD guard */
const TDD_OFF_COMMANDS = [
    "tdd off",
    "tdd-guard off",
    "fusion tdd off",
    "disable tdd",
    "/tdd off",
];

/** Commands that show TDD status */
const TDD_STATUS_COMMANDS = [
    "tdd status",
    "tdd-guard status",
    "/tdd status",
];

export interface UserPromptResult {
    /** Whether the prompt was a TDD command */
    handled: boolean;
    /** Response message to show the user */
    message?: string;
}

/**
 * Process a user prompt to check for TDD commands
 * 
 * @param prompt - The raw user prompt text
 * @returns Result indicating if handled and response message
 */
export async function processUserPrompt(prompt: string): Promise<UserPromptResult> {
    const normalized = prompt.toLowerCase().trim();
    const guard = new GuardManager();

    // Check for TDD ON commands
    if (TDD_ON_COMMANDS.some((cmd) => normalized === cmd || normalized.startsWith(cmd + " "))) {
        await guard.enable();
        return {
            handled: true,
            message: "✅ TDD Guard enabled. Test-first development is now enforced.",
        };
    }

    // Check for TDD OFF commands
    if (TDD_OFF_COMMANDS.some((cmd) => normalized === cmd || normalized.startsWith(cmd + " "))) {
        await guard.disable();
        return {
            handled: true,
            message: "⚠️ TDD Guard disabled. Edits will not require tests.",
        };
    }

    // Check for TDD STATUS commands
    if (TDD_STATUS_COMMANDS.some((cmd) => normalized === cmd || normalized.startsWith(cmd + " "))) {
        const enabled = await guard.isEnabled();
        return {
            handled: true,
            message: `TDD Guard: ${enabled ? "✅ ENABLED" : "⚠️ DISABLED"}`,
        };
    }

    // Not a TDD command
    return { handled: false };
}

/**
 * Hook handler for UserPromptSubmit events
 * 
 * This is the entry point called by the hook infrastructure.
 */
export async function handleUserPromptSubmit(event: {
    prompt?: string;
    content?: string;
}): Promise<{ continue: boolean; message?: string }> {
    const prompt = event.prompt ?? event.content ?? "";
    const result = await processUserPrompt(prompt);

    if (result.handled) {
        // Log the response
        if (result.message) {
            console.log(result.message);
        }
        return { continue: true, message: result.message };
    }

    return { continue: true };
}
