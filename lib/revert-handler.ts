import { execSync } from "node:child_process";
import { loadArchiveMetadata, type ArchiveMetadata } from "./archive-manager.js";

export type RevertLevel = "change" | "phase" | "task";

export interface RevertResult {
    success: boolean;
    revertedCommits: string[];
    errors: string[];
}

/**
 * Revert a change at the specified level
 */
export async function revertChange(
    changesDir: string,
    archiveName: string,
    level: RevertLevel,
    targetId?: string | number
): Promise<RevertResult> {
    const metadata = loadArchiveMetadata(changesDir, archiveName);

    if (!metadata) {
        return {
            success: false,
            revertedCommits: [],
            errors: [`Archive not found: ${archiveName}`],
        };
    }

    switch (level) {
        case "change":
            return revertEntireChange(metadata);
        case "phase":
            return revertPhase(metadata, targetId as number);
        case "task":
            return revertTask(metadata, targetId as string);
        default:
            return {
                success: false,
                revertedCommits: [],
                errors: [`Unknown revert level: ${level}`],
            };
    }
}

/**
 * Revert entire change
 */
async function revertEntireChange(metadata: ArchiveMetadata): Promise<RevertResult> {
    const errors: string[] = [];
    const revertedCommits: string[] = [];

    // Revert in reverse order (most recent first)
    const commits = [...metadata.allCommits].reverse();

    for (const commit of commits) {
        const result = await revertSingleCommit(commit.sha);
        if (result.success) {
            revertedCommits.push(commit.sha);
        } else {
            errors.push(result.error!);
        }
    }

    return {
        success: errors.length === 0,
        revertedCommits,
        errors,
    };
}

/**
 * Revert a specific phase
 */
async function revertPhase(
    metadata: ArchiveMetadata,
    phaseId: number
): Promise<RevertResult> {
    const phase = metadata.phases.find((p) => p.id === phaseId);

    if (!phase) {
        return {
            success: false,
            revertedCommits: [],
            errors: [`Phase not found: ${phaseId}`],
        };
    }

    const errors: string[] = [];
    const revertedCommits: string[] = [];

    // Get commits for this phase's tasks
    const taskIds = phase.tasks.map((t) => t.id);
    const commits = metadata.allCommits
        .filter((c) => c.taskId && taskIds.includes(c.taskId))
        .reverse();

    for (const commit of commits) {
        const result = await revertSingleCommit(commit.sha);
        if (result.success) {
            revertedCommits.push(commit.sha);
        } else {
            errors.push(result.error!);
        }
    }

    return {
        success: errors.length === 0,
        revertedCommits,
        errors,
    };
}

/**
 * Revert a specific task
 */
async function revertTask(
    metadata: ArchiveMetadata,
    taskId: string
): Promise<RevertResult> {
    const commit = metadata.allCommits.find((c) => c.taskId === taskId);

    if (!commit) {
        return {
            success: false,
            revertedCommits: [],
            errors: [`Task commit not found: ${taskId}`],
        };
    }

    const result = await revertSingleCommit(commit.sha);

    return {
        success: result.success,
        revertedCommits: result.success ? [commit.sha] : [],
        errors: result.error ? [result.error] : [],
    };
}

/**
 * Revert a single commit
 */
async function revertSingleCommit(
    sha: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if commit exists
        try {
            execSync(`git cat-file -t ${sha}`, { stdio: "pipe" });
        } catch {
            return {
                success: false,
                error: `Commit not found (ghost commit?): ${sha}`,
            };
        }

        // Perform revert
        execSync(`git revert --no-edit ${sha}`, { stdio: "pipe" });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: `Failed to revert ${sha}: ${String(error)}`,
        };
    }
}

/**
 * Check for ghost commits (rebased/squashed)
 */
export function checkGhostCommits(metadata: ArchiveMetadata): string[] {
    const ghosts: string[] = [];

    for (const commit of metadata.allCommits) {
        try {
            execSync(`git cat-file -t ${commit.sha}`, { stdio: "pipe" });
        } catch {
            ghosts.push(commit.sha);
        }
    }

    return ghosts;
}
