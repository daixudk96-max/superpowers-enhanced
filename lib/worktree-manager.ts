/**
 * Worktree Manager
 *
 * Manages Git worktrees for isolated feature development.
 * Supports project-local (.worktrees/) and global (~/.config/superpowers/worktrees/) locations.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

// ============================================================================
// Types
// ============================================================================

export interface WorktreeInfo {
    /** Absolute path to the worktree */
    path: string;
    /** Branch name used in the worktree */
    branch: string;
    /** Whether the worktree is project-local (true) or global (false) */
    isLocal: boolean;
}

export interface WorktreeResult {
    success: boolean;
    info?: WorktreeInfo;
    error?: string;
}

export interface IgnoreCheckResult {
    success: boolean;
    /** Whether .gitignore was updated */
    updated: boolean;
    error?: string;
}

interface WorktreeDir {
    path: string;
    isLocal: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_FILE = "CLAUDE.md";
const WORKTREE_PATTERN = /worktree[_\-\s]*(?:director(?:y|ies))?[:\s]+([^\n]+)/i;

// ============================================================================
// Public API
// ============================================================================

/**
 * Detect the preferred worktree directory.
 * Priority: .worktrees → worktrees → CLAUDE.md preference → null
 *
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function detectWorktreeDir(projectDir: string = process.cwd()): WorktreeDir | null {
    // Priority 1: .worktrees (hidden, preferred)
    const dotWorktrees = path.join(projectDir, ".worktrees");
    if (fs.existsSync(dotWorktrees)) {
        return { path: dotWorktrees, isLocal: true };
    }

    // Priority 2: worktrees (visible alternative)
    const worktrees = path.join(projectDir, "worktrees");
    if (fs.existsSync(worktrees)) {
        return { path: worktrees, isLocal: true };
    }

    // Priority 3: CLAUDE.md preference
    const claudeDir = parseClaudeWorktreePreference(projectDir);
    if (claudeDir) {
        return resolveWorktreePath(claudeDir, projectDir);
    }

    return null;
}

/**
 * Create a git worktree for the provided branch.
 *
 * @param branchName - Name of the branch (will be created if doesn't exist)
 * @param worktreePath - Optional explicit path for the worktree
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function createWorktree(
    branchName: string,
    worktreePath?: string,
    projectDir: string = process.cwd()
): WorktreeResult {
    // Determine target path
    const explicit = worktreePath ? resolveWorktreePath(worktreePath, projectDir) : null;
    const detected = worktreePath ? null : detectWorktreeDir(projectDir);
    const baseDir = explicit?.path ?? detected?.path;

    if (!baseDir && !worktreePath) {
        return {
            success: false,
            error: "No worktree directory found. Create .worktrees/ or set a CLAUDE.md preference.",
        };
    }

    const targetPath = worktreePath
        ? resolveWorktreePath(worktreePath, projectDir).path
        : path.join(baseDir!, branchName);
    const isLocal = explicit?.isLocal ?? detected?.isLocal ?? false;

    // Check if path already exists
    if (fs.existsSync(targetPath)) {
        return {
            success: false,
            error: `Worktree path already exists: ${targetPath}`,
        };
    }

    // Ensure parent directory exists
    try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    } catch (error) {
        return {
            success: false,
            error: formatError(error, "Failed to prepare worktree directory"),
        };
    }

    // Verify gitignore for local worktrees
    if (isLocal) {
        const ignoreTarget = path.dirname(targetPath);
        const ignoreResult = verifyIgnored(ignoreTarget, projectDir);
        if (!ignoreResult.success) {
            return {
                success: false,
                error: ignoreResult.error ?? "Failed to update .gitignore",
            };
        }
    }

    // Create worktree
    const branchExists = doesBranchExist(branchName, projectDir);
    const command = branchExists
        ? `git worktree add "${targetPath}" ${branchName}`
        : `git worktree add "${targetPath}" -b "${branchName}"`;

    try {
        execSync(command, { cwd: projectDir, stdio: "pipe" });
        return {
            success: true,
            info: {
                path: targetPath,
                branch: branchName,
                isLocal,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: formatError(error, "Failed to create worktree"),
        };
    }
}

/**
 * Remove a git worktree and optionally delete the branch.
 *
 * @param worktreePath - Path to the worktree to remove
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function removeWorktree(
    worktreePath: string,
    projectDir: string = process.cwd()
): WorktreeResult {
    const { path: resolvedPath, isLocal } = resolveWorktreePath(worktreePath, projectDir);
    const branch = discoverWorktreeBranch(resolvedPath, projectDir);

    if (!fs.existsSync(resolvedPath)) {
        return {
            success: false,
            error: `Worktree not found: ${resolvedPath}`,
        };
    }

    try {
        execSync(`git worktree remove "${resolvedPath}" --force`, {
            cwd: projectDir,
            stdio: "pipe",
        });

        return {
            success: true,
            info: branch
                ? { path: resolvedPath, branch, isLocal }
                : undefined,
        };
    } catch (error) {
        return {
            success: false,
            error: formatError(error, "Failed to remove worktree"),
        };
    }
}

/**
 * Check if a branch has been merged into the current branch (HEAD).
 *
 * @param branchName - Branch name to check
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function checkBranchMerged(
    branchName: string,
    projectDir: string = process.cwd()
): boolean {
    try {
        execSync(`git merge-base --is-ancestor "${branchName}" HEAD`, {
            cwd: projectDir,
            stdio: "pipe",
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Verify that a directory is ignored by git. If not, add it to .gitignore.
 *
 * @param dir - Directory to verify
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function verifyIgnored(
    dir: string,
    projectDir: string = process.cwd()
): IgnoreCheckResult {
    const resolvedDir = path.resolve(projectDir, dir);
    const entry = normalizeIgnoreEntry(resolvedDir, projectDir);
    const gitignorePath = path.join(projectDir, ".gitignore");

    // Check if already ignored
    if (isIgnored(resolvedDir, projectDir)) {
        return { success: true, updated: false };
    }

    // Add to .gitignore
    try {
        const existingContent = fs.existsSync(gitignorePath)
            ? fs.readFileSync(gitignorePath, "utf8")
            : "";

        const lines = existingContent.split("\n");
        const alreadyPresent = lines.some(
            (line) => line.trim() === entry || line.trim() === `${entry}/`
        );

        if (!alreadyPresent) {
            const newContent = existingContent.endsWith("\n") || existingContent === ""
                ? `${existingContent}${entry}/\n`
                : `${existingContent}\n${entry}/\n`;

            fs.writeFileSync(gitignorePath, newContent, "utf8");
            console.log(`[Worktree] Added "${entry}/" to .gitignore`);
        }

        return { success: true, updated: !alreadyPresent };
    } catch (error) {
        return {
            success: false,
            updated: false,
            error: formatError(error, "Failed to update .gitignore"),
        };
    }
}

/**
 * List all worktrees in the repository.
 *
 * @param projectDir - Project root directory (defaults to cwd)
 */
export function listWorktrees(projectDir: string = process.cwd()): WorktreeInfo[] {
    try {
        const output = execSync("git worktree list --porcelain", {
            cwd: projectDir,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        });

        const worktrees: WorktreeInfo[] = [];
        const blocks = output.split(/\n(?=worktree )/);

        for (const block of blocks) {
            const lines = block.split(/\r?\n/);
            const worktreeLine = lines.find((line) => line.startsWith("worktree "));
            const branchLine = lines.find((line) => line.startsWith("branch "));

            if (worktreeLine) {
                const wtPath = worktreeLine.replace("worktree ", "").trim();
                const branch = branchLine
                    ? branchLine.replace("branch ", "").trim().replace(/^refs\/heads\//, "")
                    : "HEAD";

                worktrees.push({
                    path: wtPath,
                    branch,
                    isLocal: wtPath.startsWith(path.resolve(projectDir)),
                });
            }
        }

        return worktrees;
    } catch {
        return [];
    }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function parseClaudeWorktreePreference(projectDir: string): string | null {
    const claudePath = path.join(projectDir, CLAUDE_FILE);
    if (!fs.existsSync(claudePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(claudePath, "utf8");
        const match = content.match(WORKTREE_PATTERN);
        return match?.[1]?.trim() ?? null;
    } catch {
        return null;
    }
}

function resolveWorktreePath(rawPath: string, projectDir: string): WorktreeDir {
    const expanded = expandHome(rawPath.trim());
    const resolved = path.isAbsolute(expanded)
        ? expanded
        : path.resolve(projectDir, expanded);

    return {
        path: resolved,
        isLocal: resolved.startsWith(path.resolve(projectDir)),
    };
}

function expandHome(input: string): string {
    if (input.startsWith("~")) {
        return path.join(os.homedir(), input.slice(1));
    }
    return input;
}

function doesBranchExist(branchName: string, projectDir: string): boolean {
    try {
        execSync(`git rev-parse --verify "${branchName}"`, {
            cwd: projectDir,
            stdio: "pipe",
        });
        return true;
    } catch {
        return false;
    }
}

function isIgnored(dir: string, projectDir: string): boolean {
    try {
        execSync(`git check-ignore -q -- "${dir}"`, {
            cwd: projectDir,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

function normalizeIgnoreEntry(resolvedDir: string, projectDir: string): string {
    const relative = path.relative(projectDir, resolvedDir);
    // Prefer simple entry without leading ./
    return relative.startsWith("..") ? resolvedDir : relative;
}

function discoverWorktreeBranch(worktreePath: string, projectDir: string): string | null {
    try {
        const output = execSync("git worktree list --porcelain", {
            cwd: projectDir,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        });

        const normalized = path.resolve(worktreePath);
        const blocks = output.split(/\n(?=worktree )/);

        for (const block of blocks) {
            const lines = block.split(/\r?\n/);
            const worktreeLine = lines.find((line) => line.startsWith("worktree "));
            if (!worktreeLine) continue;

            const listedPath = path.resolve(worktreeLine.replace("worktree ", "").trim());
            if (listedPath !== normalized) continue;

            const branchLine = lines.find((line) => line.startsWith("branch "));
            if (branchLine) {
                const ref = branchLine.replace("branch ", "").trim();
                return ref.replace(/^refs\/heads\//, "");
            }
        }
    } catch {
        // Ignore errors
    }

    return null;
}

function formatError(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return `${fallback}: ${error.message}`;
    }
    return fallback;
}
