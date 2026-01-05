/**
 * Implement Command
 *
 * Selects a change to implement and prepares for task execution.
 * Integrates with the executing-plans skill for task implementation.
 * Supports isolated Git worktrees for feature development.
 */
import fs from "node:fs";
import path from "node:path";
import {
    loadStatus,
    initializeStatus,
    saveStatus,
    type StatusData,
} from "../lib/task-status-tracker.js";
import { createWorktree } from "../lib/worktree-manager.js";
import { getCommandPrompt } from "./utils/prompt-reader.js";
import { WorkflowMiddleware } from "../lib/workflow-middleware.js";

/**
 * Options for the implement command
 */
export interface ImplementOptions {
    /** Skip worktree creation */
    noWorktree?: boolean;
}

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
    /** Path to the worktree directory (absolute) */
    worktreePath?: string;
    /** Branch name used for the worktree */
    worktreeBranch?: string;
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
 * @param options - Implementation options
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
    changeArg?: string,
    options: ImplementOptions = {}
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
    let worktreePath: string | undefined = statusData?.worktreePath;
    let worktreeBranch: string | undefined = statusData?.worktreeBranch;

    if (selectedChange) {
        planPath = path.join(changesDir, selectedChange, "tasks.md");
        const parsed = parseTasksFile(planPath);
        tasksTotal = parsed.total;
        tasksCompleted = parsed.completed;

        // Initialize status if not already tracking this change
        if (!statusData || statusData.changeName !== selectedChange) {
            const newStatus = initializeStatus(selectedChange);
            startedAt = newStatus.startedAt;

            // Create worktree unless disabled
            if (!options.noWorktree) {
                const branchName = `feature/${selectedChange}`;
                const result = createWorktree(branchName, undefined, projectDir);

                if (result.success && result.info) {
                    worktreePath = result.info.path;
                    worktreeBranch = result.info.branch;

                    // Update status with worktree info
                    const status = loadStatus();
                    if (status) {
                        status.worktreePath = worktreePath;
                        status.worktreeBranch = worktreeBranch;
                        saveStatus(status);
                    }

                    console.log(`[Implement] Created worktree: ${worktreePath}`);
                    console.log(`[Implement] Branch: ${worktreeBranch}`);
                } else if (result.error) {
                    console.warn(`[Implement] Worktree creation skipped: ${result.error}`);
                }
            }
        } else {
            // Existing change - use stored worktree info
            worktreePath = statusData.worktreePath;
            worktreeBranch = statusData.worktreeBranch;
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
        worktreePath,
        worktreeBranch,
    };
}

/**
 * Async implement with workflow phase tracking
 * 
 * Sets the workflow phase to 'implement' for TDD enforcement.
 */
export async function implementWithWorkflow(
    projectDir: string = process.cwd(),
    changeArg?: string,
    options: ImplementOptions = {}
): Promise<ImplementResult> {
    // Set workflow phase for TDD enforcement
    const middleware = new WorkflowMiddleware();
    await middleware.setPhase("implement");

    // Run normal implement logic
    return implement(projectDir, changeArg, options);
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
    if (result.worktreePath) {
        lines.push(`   Worktree: ${result.worktreePath}`);
        if (result.worktreeBranch) {
            lines.push(`   Branch: ${result.worktreeBranch}`);
        }
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
    if (result.worktreePath) {
        lines.push(`   cd "${result.worktreePath}"`);
    }
    lines.push("   Use /execute-plan to start implementing tasks for this change.");

    return lines.join("\n");
}

// CLI handler
const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("implement.ts");

if (isCLI) {
    const args = process.argv.slice(2);
    const changeArg = args.find((arg) => !arg.startsWith("--"));
    const noWorktree = args.includes("--no-worktree");
    const result = implement(process.cwd(), changeArg, { noWorktree });
    console.log(formatImplement(result));

    // Output prompt for agent if available
    if (result.prompt) {
        console.log("\n" + result.prompt);
    }
}
