/**
 * Lock Manager
 *
 * File-based locking mechanism to prevent multiple agents from executing
 * the same task simultaneously.
 */
import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config-loader.js";

// ============================================================================
// Types
// ============================================================================

export interface LockInfo {
    taskId: string;
    pid: number;
    acquiredAt: string;
    hostname?: string;
}

export interface LockResult {
    success: boolean;
    lockPath?: string;
    error?: string;
}

export interface CleanupResult {
    removed: string[];
    errors: string[];
}

// ============================================================================
// Constants
// ============================================================================

const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the locks directory path.
 */
export function getLocksDir(): string {
    const config = loadConfig();
    return path.join(process.cwd(), config.fusionStateDir, "locks");
}

/**
 * Acquire a lock for a task. Uses atomic file creation.
 *
 * @param taskId - Task ID to lock
 * @returns Lock result with success status
 */
export function acquireLock(taskId: string): LockResult {
    const locksDir = getLocksDir();
    const lockPath = getLockPath(taskId);

    // Ensure locks directory exists
    fs.mkdirSync(locksDir, { recursive: true });

    const lockInfo: LockInfo = {
        taskId,
        pid: process.pid,
        acquiredAt: new Date().toISOString(),
        hostname: process.env.COMPUTERNAME ?? process.env.HOSTNAME,
    };

    try {
        // Atomic file creation - fails if file exists
        const fd = fs.openSync(lockPath, "wx");
        fs.writeSync(fd, JSON.stringify(lockInfo, null, 2));
        fs.closeSync(fd);

        return { success: true, lockPath };
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === "EEXIST") {
            // Lock already held
            const existingLock = readLockInfo(lockPath);
            return {
                success: false,
                error: `Task ${taskId} is locked by PID ${existingLock?.pid ?? "unknown"} since ${existingLock?.acquiredAt ?? "unknown"}`,
            };
        }
        return {
            success: false,
            error: `Failed to acquire lock: ${String(error)}`,
        };
    }
}

/**
 * Release a lock for a task.
 *
 * @param taskId - Task ID to unlock
 * @returns Lock result with success status
 */
export function releaseLock(taskId: string): LockResult {
    const lockPath = getLockPath(taskId);

    try {
        if (fs.existsSync(lockPath)) {
            // Verify we own the lock
            const lockInfo = readLockInfo(lockPath);
            if (lockInfo && lockInfo.pid !== process.pid) {
                return {
                    success: false,
                    error: `Lock is owned by PID ${lockInfo.pid}, cannot release`,
                };
            }

            fs.unlinkSync(lockPath);
        }
        return { success: true, lockPath };
    } catch (error) {
        return {
            success: false,
            error: `Failed to release lock: ${String(error)}`,
        };
    }
}

/**
 * Check if a task is locked.
 *
 * @param taskId - Task ID to check
 * @returns Lock info if locked, null otherwise
 */
export function isLocked(taskId: string): LockInfo | null {
    const lockPath = getLockPath(taskId);
    return readLockInfo(lockPath);
}

/**
 * Cleanup stale locks (locks older than LOCK_TIMEOUT_MS).
 *
 * @returns Cleanup result with removed locks and errors
 */
export function cleanupStaleLocks(): CleanupResult {
    const locksDir = getLocksDir();
    const removed: string[] = [];
    const errors: string[] = [];

    if (!fs.existsSync(locksDir)) {
        return { removed, errors };
    }

    const now = Date.now();
    const lockFiles = fs.readdirSync(locksDir).filter((f) => f.endsWith(".lock"));

    for (const file of lockFiles) {
        const lockPath = path.join(locksDir, file);
        const lockInfo = readLockInfo(lockPath);

        if (!lockInfo) {
            // Invalid lock file - remove it
            try {
                fs.unlinkSync(lockPath);
                removed.push(file);
            } catch (err) {
                errors.push(`Failed to remove invalid lock ${file}: ${String(err)}`);
            }
            continue;
        }

        const acquiredAt = new Date(lockInfo.acquiredAt).getTime();
        if (now - acquiredAt > LOCK_TIMEOUT_MS) {
            // Stale lock - remove it
            try {
                fs.unlinkSync(lockPath);
                removed.push(file);
                console.log(`[Lock] Removed stale lock: ${file} (PID: ${lockInfo.pid})`);
            } catch (err) {
                errors.push(`Failed to remove stale lock ${file}: ${String(err)}`);
            }
        }
    }

    return { removed, errors };
}

/**
 * List all active locks.
 *
 * @returns Array of lock info
 */
export function listLocks(): LockInfo[] {
    const locksDir = getLocksDir();
    const locks: LockInfo[] = [];

    if (!fs.existsSync(locksDir)) {
        return locks;
    }

    const lockFiles = fs.readdirSync(locksDir).filter((f) => f.endsWith(".lock"));

    for (const file of lockFiles) {
        const lockPath = path.join(locksDir, file);
        const lockInfo = readLockInfo(lockPath);
        if (lockInfo) {
            locks.push(lockInfo);
        }
    }

    return locks;
}

// ============================================================================
// Internal Helpers
// ============================================================================

function getLockPath(taskId: string): string {
    const safeId = taskId.replace(/[^a-zA-Z0-9._-]/g, "_");
    return path.join(getLocksDir(), `${safeId}.lock`);
}

function readLockInfo(lockPath: string): LockInfo | null {
    try {
        if (!fs.existsSync(lockPath)) {
            return null;
        }
        const content = fs.readFileSync(lockPath, "utf8");
        return JSON.parse(content) as LockInfo;
    } catch {
        return null;
    }
}
