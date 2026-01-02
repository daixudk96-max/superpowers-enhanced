import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { archiveChange, type ArchiveMetadata } from "../lib/archive-manager.js";
import { resetStatus } from "../lib/task-status-tracker.js";
import { cleanupSessionsForChange } from "../lib/codex-session.js";
import { syncContextDocs, formatDiffs, applyDocUpdates } from "../lib/doc-sync.js";

export interface ArchiveResult {
    success: boolean;
    archivePath?: string;
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

    try {
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
 * Count incomplete tasks
 */
function countIncompleteTasks(content: string): number {
    const incompletePattern = /- \[ \]/g;
    const matches = content.match(incompletePattern);
    return matches?.length ?? 0;
}

// CLI handler
if (import.meta.url === `file://${process.argv[1]}`) {
    const changeName = process.argv[2];
    const yes = process.argv.includes("--yes");
    const createTag = process.argv.includes("--tag");
    const createCheckpoint = process.argv.includes("--checkpoint");
    const skipDocs = process.argv.includes("--skip-docs");

    if (!changeName) {
        console.error("Usage: archive <change-name> [--yes] [--tag] [--checkpoint] [--skip-docs]");
        process.exit(1);
    }

    const changesDir = path.join(process.cwd(), "changes");
    archive(changesDir, changeName, { yes, createTag, createCheckpoint, skipDocs }).then((result) => {
        if (result.success) {
            console.log(`✅ Archived to: ${result.archivePath}`);
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
