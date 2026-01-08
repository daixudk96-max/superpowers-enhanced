#!/usr/bin/env node
/**
 * Standalone entry point for UserPromptSubmit hook
 * 
 * Called by Claude Code when user submits a prompt.
 * Handles TDD on/off/status commands.
 */

import { handleUserPromptSubmit } from "./userPromptHandler.js";

// Read event from stdin or command line
async function main() {
    try {
        // Try to read from stdin (Claude Code passes event as JSON)
        const chunks: Buffer[] = [];

        // Check if stdin has data (non-blocking check)
        if (!process.stdin.isTTY) {
            for await (const chunk of process.stdin) {
                chunks.push(chunk);
            }
        }

        let event = { prompt: "", content: "" };

        if (chunks.length > 0) {
            const input = Buffer.concat(chunks).toString("utf-8").trim();
            if (input) {
                try {
                    event = JSON.parse(input);
                } catch {
                    // If not JSON, treat as raw prompt
                    event = { prompt: input, content: input };
                }
            }
        }

        const result = await handleUserPromptSubmit(event);

        // Output result as JSON for Claude Code
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("UserPromptHandler error:", error);
        console.log(JSON.stringify({ continue: true }));
    }
}

main();
