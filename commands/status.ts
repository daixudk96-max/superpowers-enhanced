/**
 * Status Command
 *
 * Reports the current project status including active change,
 * available changes, and task completion progress.
 */
import fs from "node:fs";
import path from "node:path";
import { loadStatus, type StatusData } from "../lib/task-status-tracker.js";

/**
 * Status report result
 */
export interface StatusResult {
    /** Whether a status file was found */
    statusFileFound: boolean;
    /** Name of the currently active change */
    activeChange?: string;
    /** When the active change was started */
    startedAt?: string;
    /** List of available changes in changes/ directory */
    availableChanges: string[];
    /** Task completion statistics */
    tasks: {
        total: number;
        completed: number;
        pending: number;
    };
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
        // Match checkbox pattern: - [ ], - [x], - [X], - [/]
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
 * Get project status report.
 *
 * @param projectDir - Root directory of the project
 * @returns Status report with active change and task progress
 *
 * @example
 * ```ts
 * const result = status();
 * console.log(`Active: ${result.activeChange}`);
 * console.log(`Progress: ${result.tasks.completed}/${result.tasks.total}`);
 * ```
 */
export function status(projectDir: string = process.cwd()): StatusResult {
    const changesDir = path.join(projectDir, "changes");
    const availableChanges = listChanges(changesDir);

    const statusData: StatusData | null = loadStatus();
    const statusFileFound = Boolean(statusData);

    const activeChange = statusData?.changeName;
    const startedAt = statusData?.startedAt;

    let tasksTotal = 0;
    let tasksCompleted = 0;

    if (activeChange) {
        const tasksPath = path.join(changesDir, activeChange, "tasks.md");
        const parsed = parseTasksFile(tasksPath);
        tasksTotal = parsed.total;
        tasksCompleted = parsed.completed;
    }

    return {
        statusFileFound,
        activeChange,
        startedAt,
        availableChanges,
        tasks: {
            total: tasksTotal,
            completed: tasksCompleted,
            pending: Math.max(tasksTotal - tasksCompleted, 0),
        },
    };
}

/**
 * Format status result for console output
 */
function formatStatus(result: StatusResult): string {
    const lines: string[] = [];

    lines.push("╭─────────────────────────────────────────╮");
    lines.push("│           📊 Project Status             │");
    lines.push("╰─────────────────────────────────────────╯");
    lines.push("");

    // Active change
    if (result.activeChange) {
        lines.push(`🔧 Active Change: ${result.activeChange}`);
        if (result.startedAt) {
            const started = new Date(result.startedAt).toLocaleString();
            lines.push(`   Started: ${started}`);
        }

        // Progress bar
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
    } else {
        lines.push("🔧 Active Change: none");
    }

    lines.push("");

    // Available changes
    if (result.availableChanges.length > 0) {
        lines.push("📁 Available Changes:");
        for (const change of result.availableChanges) {
            const marker = change === result.activeChange ? "→" : " ";
            lines.push(`  ${marker} ${change}`);
        }
    } else {
        lines.push("📁 No changes found. Run /new-change to create one.");
    }

    return lines.join("\n");
}

// CLI handler
const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("status.ts");

if (isCLI) {
    const result = status(process.cwd());
    console.log(formatStatus(result));
}
