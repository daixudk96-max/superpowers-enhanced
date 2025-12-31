import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { archiveChange, type ArchiveMetadata } from "../lib/archive-manager.js";
import { resetStatus } from "../lib/task-status-tracker.js";
import { cleanupSessionsForChange } from "../lib/codex-session.js";

export interface ArchiveResult {
    success: boolean;
    archivePath?: string;
    error?: string;
    metadata?: ArchiveMetadata;
}

export interface ArchiveOptions {
    yes?: boolean;
    createTag?: boolean;
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
        // const taskIds = parseTaskIds(content);
        const incompleteCount = countIncompleteTasks(content);

        if (incompleteCount > 0 && !options.yes) {
            return {
                success: false,
                error: `${incompleteCount} tasks still incomplete. Use --yes to force archive.`,
            };
        }
    }

    try {
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
        };
    } catch (error) {
        return {
            success: false,
            error: String(error),
        };
    }
}

/**
 * Parse task IDs from tasks.md content
 */
// function parseTaskIds(content: string): string[] {
//     const taskPattern = /- \[[x ]\] (\d+\.\d+)/gi;
//     const ids: string[] = [];
//     let match;
//
//     while ((match = taskPattern.exec(content)) !== null) {
//         ids.push(match[1]);
//     }
//
//     return ids;
// }

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

    if (!changeName) {
        console.error("Usage: archive <change-name> [--yes] [--tag]");
        process.exit(1);
    }

    const changesDir = path.join(process.cwd(), "changes");
    archive(changesDir, changeName, { yes, createTag }).then((result) => {
        if (result.success) {
            console.log(`✅ Archived to: ${result.archivePath}`);
        } else {
            console.error(`❌ Error: ${result.error}`);
            process.exit(1);
        }
    });
}
