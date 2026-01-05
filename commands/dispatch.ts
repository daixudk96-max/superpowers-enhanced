/**
 * Dispatch Command
 *
 * CLI for dispatching parallel tasks based on tasks.md annotations.
 */
import path from "node:path";
import fs from "node:fs";
import { parseTasksFile, getParallelReadyTasks } from "../lib/task-parser.js";
import { dispatchParallelTasks } from "../lib/parallel-dispatcher.js";
import { cleanupStaleLocks, listLocks } from "../lib/lock-manager.js";
import { loadStatus } from "../lib/task-status-tracker.js";

// ============================================================================
// Types
// ============================================================================

export interface DispatchResult {
    success: boolean;
    error?: string;
}

export interface DispatchOptions {
    /** Dry run - show what would be dispatched without executing */
    dryRun?: boolean;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Dispatch parallel tasks from the current change's tasks.md.
 *
 * @param changeArg - Optional change name (defaults to active change)
 * @param options - Dispatch options
 */
export async function dispatch(
    changeArg?: string,
    options: DispatchOptions = {}
): Promise<DispatchResult> {
    // Get active change name
    const status = loadStatus();
    const changeName = changeArg ?? status?.changeName;

    if (!changeName) {
        return {
            success: false,
            error: "No change specified. Provide change name or run /implement first.",
        };
    }

    // Find tasks.md
    const tasksPath = path.join(process.cwd(), "changes", changeName, "tasks.md");

    if (!fs.existsSync(tasksPath)) {
        return {
            success: false,
            error: `tasks.md not found: ${tasksPath}`,
        };
    }

    console.log(`[Dispatch] Parsing tasks from: ${tasksPath}`);

    // Parse tasks and find parallel groups
    const parsed = parseTasksFile(tasksPath);
    const parallelTasks = getParallelReadyTasks(parsed);

    if (parallelTasks.length === 0) {
        return {
            success: false,
            error: "No parallel task markers found in tasks.md. Use <!-- parallel: groupId --> to mark tasks.",
        };
    }

    console.log(`[Dispatch] Found ${parallelTasks.length} parallel tasks in ${parsed.parallelGroups.length} groups:`);
    for (const group of parsed.parallelGroups) {
        const pendingTasks = group.tasks.filter((t) => !t.completed && !t.inProgress);
        console.log(`  • ${group.id}: ${pendingTasks.length} pending, ${group.tasks.length} total`);
    }

    // Cleanup stale locks
    const cleaned = cleanupStaleLocks();
    if (cleaned.removed.length > 0) {
        console.log(`[Dispatch] Cleaned ${cleaned.removed.length} stale locks`);
    }

    // Show active locks
    const activeLocks = listLocks();
    if (activeLocks.length > 0) {
        console.log(`[Dispatch] Active locks: ${activeLocks.length}`);
        for (const lock of activeLocks) {
            console.log(`  • ${lock.taskId} (PID: ${lock.pid})`);
        }
    }

    // Dry run mode
    if (options.dryRun) {
        console.log("\n[Dispatch] DRY RUN - No tasks will be executed.");
        console.log("[Dispatch] Tasks that would be dispatched:");
        for (const task of parallelTasks) {
            console.log(`  • [${task.id}] ${task.title} (group: ${task.parallelGroup})`);
        }
        return { success: true };
    }

    // Execute parallel tasks
    console.log("\n[Dispatch] Starting parallel execution...\n");

    const summary = await dispatchParallelTasks(parallelTasks, {
        changeName,
        onLog: console.log,
        maxConcurrent: 4,
    });

    // Report results
    const failed = summary.results.filter((r) => r.status === "failed");
    const completed = summary.results.filter((r) => r.status === "completed");
    const skipped = summary.results.filter((r) => r.status === "skipped");

    console.log("\n╭─────────────────────────────────────────╮");
    console.log("│           📊 Dispatch Summary           │");
    console.log("╰─────────────────────────────────────────╯\n");

    console.log(`  Launched: ${summary.launched}`);
    console.log(`  Completed: ${completed.length}`);
    console.log(`  Failed: ${failed.length}`);
    console.log(`  Skipped: ${skipped.length}`);

    if (summary.startTime && summary.endTime) {
        const duration = (summary.endTime.getTime() - summary.startTime.getTime()) / 1000;
        console.log(`  Duration: ${duration.toFixed(1)}s`);
    }

    if (failed.length > 0) {
        console.log("\n❌ Failed tasks:");
        for (const result of failed) {
            console.log(`  • [${result.taskId}]: ${result.reason ?? `exit code ${result.exitCode}`}`);
        }
        return { success: false, error: "One or more tasks failed." };
    }

    console.log("\n✅ All parallel tasks completed successfully.");
    return { success: true };
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function printUsage(): void {
    console.log(`
Parallel Task Dispatch CLI

Usage:
  dispatch [change-name] [options]

Options:
  --dry-run     Show what would be dispatched without executing
  --help, -h    Show this help message

Examples:
  dispatch                           # Use active change
  dispatch my-feature               # Dispatch for specific change
  dispatch --dry-run                # Preview parallel tasks

Marking tasks for parallel execution in tasks.md:
  <!-- parallel: groupA -->
  - [ ] 1.1 Task one
  - [ ] 1.2 Task two (same group)

  - [ ] 2.1 Another task <!-- parallel: groupB -->
`);
}

const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("dispatch.ts");

if (isCLI) {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.includes("-h")) {
        printUsage();
        process.exit(0);
    }

    const changeArg = args.find((arg) => !arg.startsWith("--"));
    const dryRun = args.includes("--dry-run");

    dispatch(changeArg, { dryRun }).then((result) => {
        if (!result.success) {
            console.error(`\n❌ Dispatch failed: ${result.error}`);
            process.exit(1);
        }
    });
}

export { dispatch as dispatchCommand };
