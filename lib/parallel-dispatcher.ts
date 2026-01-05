/**
 * Parallel Dispatcher
 *
 * Dispatches multiple tasks to run in parallel, each in its own worktree.
 * Provides log aggregation and result collection.
 */
import { spawn } from "node:child_process";
import { createWorktree, removeWorktree } from "./worktree-manager.js";
import { acquireLock, releaseLock } from "./lock-manager.js";
import type { ParsedTask } from "./task-parser.js";

// ============================================================================
// Types
// ============================================================================

export interface TaskResult {
    taskId: string;
    status: "completed" | "failed" | "skipped";
    exitCode?: number;
    reason?: string;
    worktreePath?: string;
    duration?: number;
}

export interface DispatchSummary {
    launched: number;
    results: TaskResult[];
    startTime: Date;
    endTime?: Date;
}

export interface DispatchOptions {
    /** Change name for worktree branch naming */
    changeName: string;
    /** Callback for log output */
    onLog?: (line: string) => void;
    /** Maximum concurrent tasks */
    maxConcurrent?: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Dispatch multiple tasks to run in parallel.
 *
 * @param tasks - Tasks to dispatch
 * @param options - Dispatch options
 * @returns Summary of dispatch results
 */
export async function dispatchParallelTasks(
    tasks: ParsedTask[],
    options: DispatchOptions
): Promise<DispatchSummary> {
    const { changeName, onLog = console.log, maxConcurrent = 4 } = options;

    const summary: DispatchSummary = {
        launched: 0,
        results: [],
        startTime: new Date(),
    };

    // Filter out completed and in-progress tasks
    const pendingTasks = tasks.filter((t) => !t.completed && !t.inProgress);

    if (pendingTasks.length === 0) {
        onLog("[Dispatch] No pending parallel tasks found.");
        summary.endTime = new Date();
        return summary;
    }

    onLog(`[Dispatch] Found ${pendingTasks.length} parallel tasks to execute.`);

    // Process tasks in batches
    const batches = chunkArray(pendingTasks, maxConcurrent);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        onLog(`[Dispatch] Starting batch ${i + 1}/${batches.length} (${batch.length} tasks)`);

        const batchResults = await Promise.all(
            batch.map((task) => executeTaskInWorktree(task, changeName, onLog))
        );

        summary.results.push(...batchResults);
        summary.launched += batch.length;
    }

    summary.endTime = new Date();

    const completed = summary.results.filter((r) => r.status === "completed").length;
    const failed = summary.results.filter((r) => r.status === "failed").length;
    const skipped = summary.results.filter((r) => r.status === "skipped").length;

    onLog(
        `[Dispatch] Finished: ${completed} completed, ${failed} failed, ${skipped} skipped`
    );

    return summary;
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function executeTaskInWorktree(
    task: ParsedTask,
    changeName: string,
    onLog: (line: string) => void
): Promise<TaskResult> {
    const startTime = Date.now();

    // Try to acquire lock
    const lock = acquireLock(task.id);
    if (!lock.success) {
        onLog(`[Task ${task.id}] Skipped: ${lock.error}`);
        return {
            taskId: task.id,
            status: "skipped",
            reason: lock.error,
        };
    }

    onLog(`[Task ${task.id}] Acquired lock, creating worktree...`);

    // Create worktree for this task
    const branchName = `parallel/${changeName}/${sanitizeId(task.id)}`;
    const worktreeResult = createWorktree(branchName);

    if (!worktreeResult.success) {
        releaseLock(task.id);
        onLog(`[Task ${task.id}] Failed to create worktree: ${worktreeResult.error}`);
        return {
            taskId: task.id,
            status: "failed",
            reason: `Worktree creation failed: ${worktreeResult.error}`,
            duration: Date.now() - startTime,
        };
    }

    const worktreePath = worktreeResult.info!.path;
    onLog(`[Task ${task.id}] Worktree ready at ${worktreePath}`);

    try {
        // Execute task (placeholder - in real implementation, this would run
        // the actual task command or invoke an agent)
        const exitCode = await runTaskCommand(task, worktreePath, onLog);

        const status = exitCode === 0 ? "completed" : "failed";
        onLog(`[Task ${task.id}] ${status} (exit code: ${exitCode})`);

        return {
            taskId: task.id,
            status,
            exitCode,
            worktreePath,
            duration: Date.now() - startTime,
        };
    } finally {
        // Cleanup: remove worktree and release lock
        removeWorktree(worktreePath);
        releaseLock(task.id);
        onLog(`[Task ${task.id}] Cleaned up worktree and released lock`);
    }
}

async function runTaskCommand(
    task: ParsedTask,
    cwd: string,
    onLog: (line: string) => void
): Promise<number> {
    return new Promise((resolve) => {
        // For now, just echo the task - in real implementation,
        // this would run the agent or task command
        onLog(`[Task ${task.id}] Executing: ${task.title}`);

        // Simulate task execution with a simple command
        const child = spawn("echo", [`Task ${task.id}: ${task.title}`], {
            cwd,
            shell: true,
            stdio: "pipe",
        });

        child.stdout?.on("data", (data) => {
            const lines = data.toString().split("\n").filter(Boolean);
            for (const line of lines) {
                onLog(`  [${task.id}] ${line}`);
            }
        });

        child.stderr?.on("data", (data) => {
            const lines = data.toString().split("\n").filter(Boolean);
            for (const line of lines) {
                onLog(`  [${task.id}] ERR: ${line}`);
            }
        });

        child.on("error", (err) => {
            onLog(`  [${task.id}] Process error: ${err.message}`);
            resolve(1);
        });

        child.on("exit", (code) => {
            resolve(code ?? 0);
        });
    });
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9.-]/g, "-");
}
