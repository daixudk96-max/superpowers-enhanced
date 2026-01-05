import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { archiveChange, type ArchiveMetadata } from "../lib/archive-manager.js";
import { checkBranchMerged, removeWorktree } from "../lib/worktree-manager.js";
import { loadStatus, resetStatus, saveStatus } from "../lib/task-status-tracker.js";
import { cleanupSessionsForChange } from "../lib/codex-session.js";
import { syncContextDocs, formatDiffs, applyDocUpdates } from "../lib/doc-sync.js";

export interface ArchiveResult {
    success: boolean;
    archivePath?: string;
    /** Path to the Git archive zip file */
    archiveZipPath?: string;
    error?: string;
    metadata?: ArchiveMetadata;
    checkpointSha?: string;
}

export interface ArchiveOptions {
    yes?: boolean;
    createTag?: boolean;
    createCheckpoint?: boolean;
    phaseName?: string;
    summary?: string;
    skipDocs?: boolean;
    /** Skip automatic merge of worktree branch */
    noMerge?: boolean;
    /** Skip Git archive zip creation */
    noZip?: boolean;
}

/**
 * Create a checkpoint commit for completed phase.
 * Returns the short SHA (7 characters) of the commit.
 */
export function createCheckpointCommit(phaseName: string): string | null {
    try {
        // Stage all changes
        execSync("git add .", { stdio: "pipe" });

        // Create checkpoint commit (allow empty in case everything is already committed)
        const message = `checkpoint(${phaseName}): Phase complete`;
        execSync(`git commit --allow-empty -m "${message}"`, { stdio: "pipe" });

        // Get the short SHA
        const sha = execSync("git rev-parse --short HEAD", { stdio: "pipe" })
            .toString()
            .trim();

        console.log(`[Checkpoint] Created commit: ${sha}`);
        return sha;
    } catch (error) {
        console.warn(`[Checkpoint] Failed to create commit: ${error}`);
        return null;
    }
}

/**
 * Attach a git note to a commit with task summary.
 */
export function attachGitNote(commitSha: string, summary: string): boolean {
    try {
        // Escape quotes in summary for shell
        const escapedSummary = summary.replace(/"/g, '\\"');
        execSync(`git notes add -m "${escapedSummary}" ${commitSha}`, { stdio: "pipe" });
        console.log(`[Checkpoint] Attached note to ${commitSha}`);
        return true;
    } catch (error) {
        console.warn(`[Checkpoint] Failed to attach note: ${error}`);
        return false;
    }
}

/**
 * Archive command handler - archives a completed change
 */
export async function archive(
    changesDir: string,
    changeName: string,
    options: ArchiveOptions = {}
): Promise<ArchiveResult> {
    const sourceDir = path.join(changesDir, changeName);

    // Check if change exists
    if (!fs.existsSync(sourceDir)) {
        return {
            success: false,
            error: `Change not found: ${changeName}`,
        };
    }

    // Parse tasks.md to get task IDs
    const tasksFile = path.join(sourceDir, "tasks.md");
    if (fs.existsSync(tasksFile)) {
        const content = fs.readFileSync(tasksFile, "utf8");
        const incompleteCount = countIncompleteTasks(content);

        if (incompleteCount > 0 && !options.yes) {
            return {
                success: false,
                error: `${incompleteCount} tasks still incomplete. Use --yes to force archive.`,
            };
        }
    }

    let checkpointSha: string | undefined;
    let archiveZipPath: string | undefined;

    try {
        // Handle worktree merge and cleanup before archive
        const worktreeResult = await handleWorktreeBeforeArchive(changesDir, options);
        if (!worktreeResult.success) {
            return {
                success: false,
                error: worktreeResult.error ?? "Worktree handling failed.",
            };
        }
        archiveZipPath = worktreeResult.archiveZipPath;

        // Document synchronization before checkpoint
        if (!options.skipDocs) {
            const contextDir = path.join(path.dirname(changesDir), "context");
            if (fs.existsSync(contextDir)) {
                console.log("[Archive] Analyzing change for context document updates...");
                const updates = await syncContextDocs({
                    changeDir: sourceDir,
                    contextDir,
                });

                if (updates.length > 0) {
                    console.log("\n📄 Suggested context document updates:\n");
                    console.log(formatDiffs(updates));
                    console.log("");

                    const shouldApply = options.yes || await promptYesNo("Apply these updates? (y/n): ");
                    if (shouldApply) {
                        applyDocUpdates(updates, contextDir);
                        console.log("[Archive] Context documents updated.");
                    } else {
                        console.log("[Archive] Skipped context document updates.");
                    }
                } else {
                    console.log("[Archive] No context document updates needed.");
                }
            }
        }

        // Create checkpoint commit if requested
        if (options.createCheckpoint) {
            const phaseName = options.phaseName ?? changeName;
            const sha = createCheckpointCommit(phaseName);
            if (sha) {
                checkpointSha = sha;

                // Attach git note with summary if provided
                if (options.summary) {
                    attachGitNote(sha, options.summary);
                }
            }
        }

        // Perform archive
        const archivePath = await archiveChange(changeName, sourceDir);

        // Create Git tag if requested
        if (options.createTag) {
            try {
                const tagName = `archive/${changeName}`;
                execSync(`git tag -a ${tagName} -m "Archived change: ${changeName}"`, {
                    stdio: "pipe",
                });
            } catch {
                // Tag creation is optional, ignore errors
            }
        }

        // Cleanup Codex sessions
        cleanupSessionsForChange(changeName);

        // Reset status tracking
        resetStatus();

        return {
            success: true,
            archivePath,
            archiveZipPath,
            checkpointSha,
        };
    } catch (error) {
        return {
            success: false,
            error: String(error),
        };
    }
}

/**
 * Handle worktree merge and cleanup before archive.
 * Creates Git archive zip if worktree exists.
 */
async function handleWorktreeBeforeArchive(
    changesDir: string,
    options: ArchiveOptions
): Promise<{ success: boolean; error?: string; archiveZipPath?: string }> {
    const status = loadStatus();

    // No worktree configured - skip
    if (!status?.worktreePath || !status?.worktreeBranch) {
        return { success: true };
    }

    console.log(`[Archive] Found worktree: ${status.worktreePath} (${status.worktreeBranch})`);

    // Check if branch is already merged
    const isMerged = checkBranchMerged(status.worktreeBranch);

    if (!isMerged) {
        if (options.noMerge) {
            return {
                success: false,
                error: `Worktree branch "${status.worktreeBranch}" is not merged. Remove --no-merge to auto-merge.`,
            };
        }

        const shouldMerge =
            options.yes ||
            (await promptYesNo(
                `Worktree branch "${status.worktreeBranch}" is not merged. Merge now? (y/n): `
            ));

        if (!shouldMerge) {
            return {
                success: false,
                error: "Archive cancelled: worktree branch not merged.",
            };
        }

        try {
            console.log(`[Archive] Merging branch: ${status.worktreeBranch}`);
            execSync(`git merge ${status.worktreeBranch}`, { stdio: "inherit" });
        } catch {
            return {
                success: false,
                error: "Merge failed. Resolve conflicts and retry archive.",
            };
        }
    } else {
        console.log(`[Archive] Branch ${status.worktreeBranch} is already merged.`);
    }

    // Create Git archive zip
    let archiveZipPath: string | undefined;
    if (!options.noZip) {
        const timestamp = formatArchiveTimestamp();
        const archiveDir = path.join(changesDir, "archive");
        const zipName = `${status.changeName}-${timestamp}.zip`;
        archiveZipPath = path.join(archiveDir, zipName);

        fs.mkdirSync(archiveDir, { recursive: true });

        try {
            execSync(`git archive --format=zip HEAD -o "${archiveZipPath}"`, {
                stdio: "pipe",
            });
            console.log(`[Archive] Created Git archive: ${archiveZipPath}`);
        } catch (error) {
            console.warn(
                `[Archive] Warning: Failed to create Git archive (${String(error)}). Continuing...`
            );
            archiveZipPath = undefined;
        }
    }

    // Remove worktree
    const removal = removeWorktree(status.worktreePath);
    if (removal.success) {
        console.log(`[Archive] Removed worktree: ${status.worktreePath}`);
    } else {
        console.warn(`[Archive] Warning: Failed to remove worktree (${removal.error}). Continuing...`);
    }

    // Clear worktree fields from status
    delete status.worktreePath;
    delete status.worktreeBranch;
    saveStatus(status);

    return { success: true, archiveZipPath };
}

/**
 * Format timestamp for archive filenames (YYYYMMDD-HHMMSS)
 */
function formatArchiveTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Count incomplete tasks
 */
function countIncompleteTasks(content: string): number {
    const incompletePattern = /- \[ \]/g;
    const matches = content.match(incompletePattern);
    return matches?.length ?? 0;
}

// CLI handler
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const changeName = args.find((arg) => !arg.startsWith("--"));
    const yes = args.includes("--yes");
    const createTag = args.includes("--tag");
    const createCheckpoint = args.includes("--checkpoint");
    const skipDocs = args.includes("--skip-docs");
    const noMerge = args.includes("--no-merge");
    const noZip = args.includes("--no-zip");

    if (!changeName) {
        console.error("Usage: archive <change-name> [--yes] [--tag] [--checkpoint] [--skip-docs] [--no-merge] [--no-zip]");
        process.exit(1);
    }

    const changesDir = path.join(process.cwd(), "changes");
    archive(changesDir, changeName, { yes, createTag, createCheckpoint, skipDocs, noMerge, noZip }).then((result) => {
        if (result.success) {
            console.log(`✅ Archived to: ${result.archivePath}`);
            if (result.archiveZipPath) {
                console.log(`📦 Git archive: ${result.archiveZipPath}`);
            }
            if (result.checkpointSha) {
                console.log(`📍 Checkpoint: ${result.checkpointSha}`);
            }
        } else {
            console.error(`❌ Error: ${result.error}`);
            process.exit(1);
        }
    });
}

/**
 * Prompt user for yes/no confirmation
 */
async function promptYesNo(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(message, (answer) => {
            rl.close();
            const normalized = answer.trim().toLowerCase();
            resolve(normalized === "y" || normalized === "yes");
        });
    });
}
