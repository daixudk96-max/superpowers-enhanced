import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read the markdown prompt content from a corresponding .md file.
 * Looks for the "## Completion" or "## Next Steps" section and returns its content.
 *
 * @param tsFilePath - The path to the .ts file (or __filename)
 * @returns The prompt content or null if not found
 *
 * @example
 * // In setup.ts
 * const prompt = readMarkdownPrompt(__filename);
 * // Returns content from setup.md's "## Completion" section
 */
export function readMarkdownPrompt(tsFilePath: string): string | null {
    // Convert .ts to .md
    const mdPath = tsFilePath.replace(/\.ts$/, ".md");

    if (!fs.existsSync(mdPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(mdPath, "utf-8");

        // Look for specific sections
        const completionMatch = content.match(
            /## (?:Completion|Next Steps|After Completion)([\s\S]*?)(?=\n## |\n---|\n$|$)/i
        );

        if (completionMatch) {
            return completionMatch[1].trim();
        }

        // Fallback: return everything after the first header
        const afterFirstHeader = content.match(/^#[^#].*\n([\s\S]*)/m);
        if (afterFirstHeader) {
            return afterFirstHeader[1].trim();
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get the commands directory path relative to this file.
 */
export function getCommandsDir(): string {
    return path.resolve(__dirname, "..");
}

/**
 * Read and return the prompt for the given command name.
 *
 * @param commandName - The command name without extension (e.g., "setup", "new-change")
 */
export function getCommandPrompt(commandName: string): string | null {
    const mdPath = path.join(getCommandsDir(), `${commandName}.md`);

    if (!fs.existsSync(mdPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(mdPath, "utf-8");

        // Extract completion/next steps section
        const completionMatch = content.match(
            /## (?:Completion|Next Steps)[^\n]*\n([\s\S]*?)(?=\n## |\n---|\n$|$)/i
        );

        if (completionMatch) {
            return completionMatch[1].trim();
        }

        return null;
    } catch {
        return null;
    }
}
