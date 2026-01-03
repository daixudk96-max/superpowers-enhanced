/**
 * Implement Command
 *
 * Selects a change to implement and prepares for task execution.
 * Integrates with the executing-plans skill for task implementation.
 */
import fs from "node:fs";
import path from "node:path";
import { loadStatus, initializeStatus, type StatusData } from "../lib/task-status-tracker.js";
import { getCommandPrompt } from "./utils/prompt-reader.js";
import { WorkflowMiddleware } from "../lib/workflow-middleware.js";

/**
 * Implementation result
 */
export interface ImplementResult {
    /** List of available changes */
    availableChanges: string[];
    /** The selected change to implement */
    selectedChange?: string;
    /** When the change was started */
    startedAt?: string;
    /** Task progress statistics */
    tasks: {
        total: number;
        completed: number;
        pending: number;
    };
    /** Path to the tasks.md file */
    planPath?: string;
    /** Next step prompt for the agent */
    prompt?: string;
}

/**
 * List all change directories
 */
function listChanges(changesDir: string): string[] {
    if (!fs.existsSync(changesDir)) return [];
    return fs
        .readdirSync(changesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => name !== "archive" && !name.startsWith("."));
}

/**
 * Parse tasks.md to count completed and pending tasks
 */
function parseTasksFile(tasksPath: string): { total: number; completed: number } {
    if (!fs.existsSync(tasksPath)) return { total: 0, completed: 0 };

    const content = fs.readFileSync(tasksPath, "utf8");
    const lines = content.split("\n");

    let total = 0;
    let completed = 0;

    for (const line of lines) {
        const match = line.match(/^\s*-\s\[( |x|X|\/)\]/);
        if (match) {
            total += 1;
            if (match[1].toLowerCase() === "x") {
                completed += 1;
            }
        }
    }

    return { total, completed };
}

/**
 * Select a change to implement and prepare for execution.
 *
 * @param projectDir - Root directory of the project
 * @param changeArg - Optional change name to implement (defaults to active change)
 * @returns Implementation result with selected change and task progress
 *
 * @example
 * ```ts
 * const result = implement(process.cwd(), "my-feature");
 * console.log(`Implementing: ${result.selectedChange}`);
 * console.log(`Tasks: ${result.tasks.pending} pending`);
 * ```
 */
export function implement(
    projectDir: string = process.cwd(),
    changeArg?: string
): ImplementResult {
    const changesDir = path.join(projectDir, "changes");
    const availableChanges = listChanges(changesDir);

    const statusData: StatusData | null = loadStatus();
    const activeChange = statusData?.changeName;
    const selectedChange = changeArg || activeChange || undefined;

    let tasksTotal = 0;
    let tasksCompleted = 0;
    let planPath: string | undefined;
    let startedAt: string | undefined = statusData?.startedAt;

    if (selectedChange) {
        planPath = path.join(changesDir, selectedChange, "tasks.md");
        const parsed = parseTasksFile(planPath);
        tasksTotal = parsed.total;
        tasksCompleted = parsed.completed;

        // Initialize status if not already tracking this change
        if (!statusData || statusData.changeName !== selectedChange) {
            const newStatus = initializeStatus(selectedChange);
            startedAt = newStatus.startedAt;
        }
    }

    // Get the next-step prompt
    const prompt = getCommandPrompt("execute-plan") ?? undefined;

    return {
        availableChanges,
        selectedChange,
        startedAt,
        planPath,
        tasks: {
            total: tasksTotal,
            completed: tasksCompleted,
            pending: Math.max(tasksTotal - tasksCompleted, 0),
        },
        prompt,
    };
}

/**
 * Async implement with workflow phase tracking
 * 
 * Sets the workflow phase to 'implement' for TDD enforcement.
 */
export async function implementWithWorkflow(
    projectDir: string = process.cwd(),
    changeArg?: string
): Promise<ImplementResult> {
    // Set workflow phase for TDD enforcement
    const middleware = new WorkflowMiddleware();
    await middleware.setPhase("implement");

    // Run normal implement logic
    return implement(projectDir, changeArg);
}

/**
 * Format implementation result for console output
 */
function formatImplement(result: ImplementResult): string {
    const lines: string[] = [];

    lines.push("╭─────────────────────────────────────────╮");
    lines.push("│           🚀 Implement                  │");
    lines.push("╰─────────────────────────────────────────╯");
    lines.push("");

    // Available changes
    if (result.availableChanges.length > 0) {
        lines.push("📁 Available Changes:");
        for (const change of result.availableChanges) {
            const marker = change === result.selectedChange ? "→" : " ";
            lines.push(`  ${marker} ${change}`);
        }
        lines.push("");
    }

    // Selected change
    if (!result.selectedChange) {
        lines.push("⚠️  No change selected.");
        lines.push("   Provide a change name: npx tsx commands/implement.ts <change-name>");
        return lines.join("\n");
    }

    lines.push(`🔧 Selected: ${result.selectedChange}`);
    if (result.startedAt) {
        const started = new Date(result.startedAt).toLocaleString();
        lines.push(`   Started: ${started}`);
    }

    // Progress
    const percent =
        result.tasks.total > 0
            ? Math.round((result.tasks.completed / result.tasks.total) * 100)
            : 0;
    const filled = Math.round(percent / 5);
    const empty = 20 - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    lines.push(`   Progress: [${bar}] ${percent}%`);
    lines.push(
        `   Tasks: ${result.tasks.completed}/${result.tasks.total} completed, ${result.tasks.pending} pending`
    );

    lines.push("");
    lines.push("📋 Next Step:");
    lines.push("   Use /execute-plan to start implementing tasks for this change.");

    return lines.join("\n");
}

// CLI handler
const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("implement.ts");

if (isCLI) {
    const changeArg = process.argv[2];
    const result = implement(process.cwd(), changeArg);
    console.log(formatImplement(result));

    // Output prompt for agent if available
    if (result.prompt) {
        console.log("\n" + result.prompt);
    }
}
