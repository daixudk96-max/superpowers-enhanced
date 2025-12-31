import path from "node:path";
import {
    revertChange,
    checkGhostCommits,
    type RevertLevel,
} from "../lib/revert-handler.js";
import {
    listArchivedChanges,
    loadArchiveMetadata,
} from "../lib/archive-manager.js";

export interface RevertOptions {
    level: "list" | RevertLevel;
    archiveName?: string;
    targetId?: string | number;
}

export interface RevertCommandResult {
    success: boolean;
    revertedCommits?: string[];
    errors?: string[];
    archives?: string[];
    ghostCommits?: string[];
}

/**
 * Revert command handler - reverts changes at various granularity levels
 */
export async function revert(
    changesDir: string,
    options: RevertOptions
): Promise<RevertCommandResult> {
    // List mode
    if (options.level === "list") {
        const archives = listArchivedChanges(changesDir);
        return {
            success: true,
            archives,
        };
    }

    // Revert mode - need archive name
    if (!options.archiveName) {
        return {
            success: false,
            errors: ["Archive name is required for revert"],
        };
    }

    // Check for ghost commits first
    const metadata = loadArchiveMetadata(changesDir, options.archiveName);
    if (!metadata) {
        return {
            success: false,
            errors: [`Archive not found: ${options.archiveName}`],
        };
    }

    const ghosts = checkGhostCommits(metadata);
    if (ghosts.length > 0) {
        console.warn("⚠️ Ghost commits detected (may have been rebased):");
        ghosts.forEach((sha) => console.warn(`   - ${sha.slice(0, 8)}`));
    }

    // Perform revert
    const result = await revertChange(
        changesDir,
        options.archiveName,
        options.level as RevertLevel,
        options.targetId
    );

    return {
        success: result.success,
        revertedCommits: result.revertedCommits,
        errors: result.errors,
        ghostCommits: ghosts.length > 0 ? ghosts : undefined,
    };
}

// CLI handler
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const changesDir = path.join(process.cwd(), "changes");

    // No args: list mode
    if (args.length === 0) {
        revert(changesDir, { level: "list" }).then((result) => {
            if (result.archives && result.archives.length > 0) {
                console.log("📦 Archived changes:");
                result.archives.forEach((a) => console.log(`   - ${a}`));
            } else {
                console.log("No archived changes found.");
            }
        });
    } else {
        const [level, ...rest] = args;

        let options: RevertOptions;

        switch (level) {
            case "change": {
                const [name] = rest;
                options = { level: "change", archiveName: name };
                break;
            }
            case "phase": {
                const [name, phaseId] = rest;
                options = { level: "phase", archiveName: name, targetId: parseInt(phaseId) };
                break;
            }
            case "task": {
                const [name, taskId] = rest;
                options = { level: "task", archiveName: name, targetId: taskId };
                break;
            }
            default:
                console.error("Usage:");
                console.error("  revert                     # List archives");
                console.error("  revert change <name>       # Revert entire change");
                console.error("  revert phase <name> <n>    # Revert phase");
                console.error("  revert task <name> <id>    # Revert task");
                process.exit(1);
        }

        revert(changesDir, options).then((result) => {
            if (result.success) {
                console.log(`✅ Reverted ${result.revertedCommits?.length ?? 0} commits`);
                result.revertedCommits?.forEach((sha) =>
                    console.log(`   - ${sha.slice(0, 8)}`)
                );
            } else {
                console.error("❌ Revert failed:");
                result.errors?.forEach((e) => console.error(`   - ${e}`));
                process.exit(1);
            }
        });
    }
}
