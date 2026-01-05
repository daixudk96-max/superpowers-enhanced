/**
 * Worktree Command
 *
 * CLI for managing Git worktrees.
 * Subcommands: create, list, cleanup
 */
import {
    createWorktree,
    listWorktrees,
    removeWorktree,
    detectWorktreeDir,
} from "../lib/worktree-manager.js";

// ============================================================================
// Subcommand Handlers
// ============================================================================

function handleCreate(branchName: string, targetPath?: string): void {
    if (!branchName) {
        console.error("Usage: worktree create <branch-name> [path]");
        process.exit(1);
    }

    console.log(`Creating worktree for branch: ${branchName}`);
    const result = createWorktree(branchName, targetPath);

    if (result.success && result.info) {
        console.log(`✅ Worktree created:`);
        console.log(`   Path: ${result.info.path}`);
        console.log(`   Branch: ${result.info.branch}`);
        console.log(`   Local: ${result.info.isLocal ? "Yes" : "No (global)"}`);
    } else {
        console.error(`❌ Failed: ${result.error}`);
        process.exit(1);
    }
}

function handleList(): void {
    const worktrees = listWorktrees();

    if (worktrees.length === 0) {
        console.log("No worktrees found.");
        return;
    }

    console.log("📁 Active Worktrees:\n");
    for (const wt of worktrees) {
        const localTag = wt.isLocal ? "[local]" : "[global]";
        console.log(`  ${localTag} ${wt.branch}`);
        console.log(`    → ${wt.path}`);
        console.log("");
    }
}

function handleCleanup(worktreePath?: string): void {
    if (worktreePath) {
        // Remove specific worktree
        const result = removeWorktree(worktreePath);
        if (result.success) {
            console.log(`✅ Removed worktree: ${worktreePath}`);
        } else {
            console.error(`❌ Failed: ${result.error}`);
            process.exit(1);
        }
        return;
    }

    // Detect default worktree directory
    const detected = detectWorktreeDir();
    if (!detected) {
        console.log("No worktree directory found.");
        return;
    }

    console.log(`Worktree directory: ${detected.path}`);
    console.log("Use 'worktree cleanup <path>' to remove a specific worktree.");
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function printUsage(): void {
    console.log(`
Worktree Management CLI

Usage:
  worktree create <branch-name> [path]  Create a new worktree
  worktree list                         List all worktrees
  worktree cleanup [path]               Remove a worktree

Options:
  --help, -h    Show this help message

Examples:
  worktree create feature/auth
  worktree create fix/bug-123 ./my-worktree
  worktree list
  worktree cleanup .worktrees/feature-auth
`);
}

const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("worktree.ts");

if (isCLI) {
    const args = process.argv.slice(2);
    const subcommand = args[0];

    if (!subcommand || subcommand === "--help" || subcommand === "-h") {
        printUsage();
        process.exit(0);
    }

    switch (subcommand) {
        case "create":
            handleCreate(args[1], args[2]);
            break;
        case "list":
            handleList();
            break;
        case "cleanup":
            handleCleanup(args[1]);
            break;
        default:
            console.error(`Unknown subcommand: ${subcommand}`);
            printUsage();
            process.exit(1);
    }
}

export { handleCreate, handleList, handleCleanup };
