import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { loadConfig } from "./config-loader.js";

export interface TaskStatus {
    id: string;
    status: "pending" | "in-progress" | "complete" | "skipped";
    sha?: string;
    message?: string;
    startedAt?: string;
    completedAt?: string;
}

export interface StatusData {
    changeName: string;
    startedAt: string;
    tasks: Record<string, TaskStatus>;
    codexSessions: Record<string, string>;
    /** Path to the worktree directory (relative or absolute) */
    worktreePath?: string;
    /** Branch name used for the worktree */
    worktreeBranch?: string;
}

/**
 * Get the status file path
 */
function getStatusFilePath(): string {
    const config = loadConfig();
    const dir = path.resolve(process.cwd(), config.fusionStateDir);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, "status.json");
}

/**
 * Load current status
 */
export function loadStatus(): StatusData | null {
    const file = getStatusFilePath();

    if (!fs.existsSync(file)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return null;
    }
}

/**
 * Save status
 */
export function saveStatus(data: StatusData): void {
    const file = getStatusFilePath();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Initialize status for a new change
 */
export function initializeStatus(changeName: string): StatusData {
    const data: StatusData = {
        changeName,
        startedAt: new Date().toISOString(),
        tasks: {},
        codexSessions: {},
    };

    saveStatus(data);
    return data;
}

/**
 * Record task as in-progress
 */
export function startTask(taskId: string): void {
    const status = loadStatus();
    if (!status) return;

    status.tasks[taskId] = {
        id: taskId,
        status: "in-progress",
        startedAt: new Date().toISOString(),
    };

    saveStatus(status);
}

/**
 * Record task completion with Git SHA
 */
export function completeTask(
    taskId: string,
    commitMessage?: string
): TaskStatus | null {
    const status = loadStatus();
    if (!status) return null;

    // Get current HEAD SHA
    let sha: string | undefined;
    try {
        sha = execSync("git rev-parse HEAD", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch {
        // Git unavailable
    }

    // Get commit message if not provided
    let message = commitMessage;
    if (!message && sha) {
        try {
            message = execSync(`git log -1 --format=%s ${sha}`, {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "pipe"],
            }).trim();
        } catch {
            // Ignore
        }
    }

    const task: TaskStatus = {
        id: taskId,
        status: "complete",
        sha,
        message,
        completedAt: new Date().toISOString(),
        startedAt: status.tasks[taskId]?.startedAt,
    };

    status.tasks[taskId] = task;
    saveStatus(status);

    return task;
}

/**
 * Record Codex session ID
 */
export function recordCodexSession(purpose: string, sessionId: string): void {
    const status = loadStatus();
    if (!status) return;

    status.codexSessions[purpose] = sessionId;
    saveStatus(status);
}

/**
 * Get Codex session ID
 */
export function getCodexSession(purpose: string): string | undefined {
    const status = loadStatus();
    return status?.codexSessions[purpose];
}

/**
 * Check if all tasks are complete
 */
export function allTasksComplete(taskIds: string[]): boolean {
    const status = loadStatus();
    if (!status) return false;

    return taskIds.every((id) => status.tasks[id]?.status === "complete");
}

/**
 * Reset status (for new change)
 */
export function resetStatus(): void {
    const file = getStatusFilePath();
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}
