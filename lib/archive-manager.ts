import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config-loader.js";

export interface ArchiveMetadata {
    changeName: string;
    archivedAt: string;
    branchName?: string;
    phases: PhaseMetadata[];
    allCommits: CommitInfo[];
    revertInstructions: string[];
}

export interface PhaseMetadata {
    id: number;
    title: string;
    tasks: TaskMetadata[];
}

export interface TaskMetadata {
    id: string;
    description: string;
    status: "complete" | "skipped";
    sha?: string;
    message?: string;
    completedAt?: string;
}

export interface CommitInfo {
    sha: string;
    message: string;
    timestamp: string;
    taskId?: string;
}

/**
 * Archive a completed change to the archive directory
 */
export async function archiveChange(
    changeName: string,
    sourceDir: string
): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const archiveName = `${timestamp}-${changeName}`;
    const archiveDir = path.join(sourceDir, "..", "archive", archiveName);

    // Create archive directory
    fs.mkdirSync(archiveDir, { recursive: true });

    // Copy all files from source to archive
    copyDirectory(sourceDir, archiveDir);

    // Generate metadata.json
    const metadata = await generateMetadata(changeName, sourceDir);
    fs.writeFileSync(
        path.join(archiveDir, "metadata.json"),
        JSON.stringify(metadata, null, 2),
        "utf8"
    );

    // Remove source directory
    fs.rmSync(sourceDir, { recursive: true, force: true });

    return archiveDir;
}

/**
 * Generate archive metadata including all commit SHAs
 */
async function generateMetadata(
    changeName: string,
    _sourceDir: string
): Promise<ArchiveMetadata> {
    const config = loadConfig();
    const statusFile = path.join(
        process.cwd(),
        config.fusionStateDir,
        "status.json"
    );

    let phases: PhaseMetadata[] = [];
    let allCommits: CommitInfo[] = [];

    // Read status file if exists
    if (fs.existsSync(statusFile)) {
        try {
            const status = JSON.parse(fs.readFileSync(statusFile, "utf8"));
            if (status.tasks) {
                // Convert tasks to phases structure
                allCommits = Object.entries(status.tasks)
                    .filter(([, task]: [string, unknown]) => {
                        const t = task as { sha?: string };
                        return t.sha;
                    })
                    .map(([taskId, task]: [string, unknown]) => {
                        const t = task as {
                            sha: string;
                            message?: string;
                            completedAt?: string;
                        };
                        return {
                            sha: t.sha,
                            message: t.message ?? "",
                            timestamp: t.completedAt ?? new Date().toISOString(),
                            taskId,
                        };
                    });
            }
        } catch {
            // Ignore parse errors
        }
    }

    // Generate revert instructions
    const revertInstructions = allCommits
        .reverse()
        .map((c) => `git revert --no-edit ${c.sha}`);

    return {
        changeName,
        archivedAt: new Date().toISOString(),
        phases,
        allCommits,
        revertInstructions,
    };
}

/**
 * List all archived changes
 */
export function listArchivedChanges(changesDir: string): string[] {
    const archiveDir = path.join(changesDir, "archive");

    if (!fs.existsSync(archiveDir)) {
        return [];
    }

    return fs
        .readdirSync(archiveDir)
        .filter((name) => {
            const stat = fs.statSync(path.join(archiveDir, name));
            return stat.isDirectory();
        })
        .sort()
        .reverse(); // Most recent first
}

/**
 * Load metadata for an archived change
 */
export function loadArchiveMetadata(
    changesDir: string,
    archiveName: string
): ArchiveMetadata | null {
    const metadataPath = path.join(
        changesDir,
        "archive",
        archiveName,
        "metadata.json"
    );

    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    } catch {
        return null;
    }
}

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
