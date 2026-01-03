/**
 * Storage - Unified state persistence layer for TDD enforcement
 *
 * Provides abstracted file storage for test results, lint results, and runtime config.
 * This design allows for easy testing (via mock storage) and consistent state management.
 */

import path from "path";
import fs from "fs/promises";

/**
 * Storage interface for state persistence
 * Abstracts file operations to enable testing and future storage backends
 */
export interface Storage {
    /** Save test results */
    saveTest(content: string): Promise<void>;
    /** Get test results, returns null if not found */
    getTest(): Promise<string | null>;

    /** Save lint results */
    saveLint(content: string): Promise<void>;
    /** Get lint results, returns null if not found */
    getLint(): Promise<string | null>;

    /** Save runtime config (e.g., guardEnabled) */
    saveConfig(content: string): Promise<void>;
    /** Get runtime config, returns null if not found */
    getConfig(): Promise<string | null>;

    /** Clear transient data (test and lint results) on session start */
    clearTransientData(): Promise<void>;
}

/** File names for state persistence */
const FILE_NAMES = {
    test: "test-results.json",
    lint: "lint-results.json",
    config: "config.json",
} as const;

/**
 * FileStorage - Production implementation of Storage interface
 *
 * Stores state in the `.fusion/` directory (configurable via constructor).
 * Automatically creates the directory if it doesn't exist.
 */
export class FileStorage implements Storage {
    private readonly rootDir: string;
    private readonly testPath: string;
    private readonly lintPath: string;
    private readonly configPath: string;

    /**
     * Create a FileStorage instance
     * @param stateDir - Directory for state files, defaults to ".fusion"
     */
    constructor(stateDir = ".fusion") {
        this.rootDir = path.resolve(stateDir);
        this.testPath = path.join(this.rootDir, FILE_NAMES.test);
        this.lintPath = path.join(this.rootDir, FILE_NAMES.lint);
        this.configPath = path.join(this.rootDir, FILE_NAMES.config);
    }

    /** Ensure the storage directory exists */
    private async ensureDir(): Promise<void> {
        await fs.mkdir(this.rootDir, { recursive: true });
    }

    /** Write content to a file, creating the directory if needed */
    private async writeFile(filePath: string, content: string): Promise<void> {
        await this.ensureDir();
        await fs.writeFile(filePath, content, "utf-8");
    }

    /** Read a file, returning null if it doesn't exist */
    private async readFileOrNull(filePath: string): Promise<string | null> {
        try {
            return await fs.readFile(filePath, "utf-8");
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    /** Remove a file, ignoring if it doesn't exist */
    private async removeFile(filePath: string): Promise<void> {
        try {
            await fs.rm(filePath, { force: true });
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err?.code === "ENOENT") {
                return;
            }
            throw error;
        }
    }

    // --- Public API ---

    async saveTest(content: string): Promise<void> {
        await this.writeFile(this.testPath, content);
    }

    async getTest(): Promise<string | null> {
        return this.readFileOrNull(this.testPath);
    }

    async saveLint(content: string): Promise<void> {
        await this.writeFile(this.lintPath, content);
    }

    async getLint(): Promise<string | null> {
        return this.readFileOrNull(this.lintPath);
    }

    async saveConfig(content: string): Promise<void> {
        await this.writeFile(this.configPath, content);
    }

    async getConfig(): Promise<string | null> {
        return this.readFileOrNull(this.configPath);
    }

    async clearTransientData(): Promise<void> {
        await Promise.all([
            this.removeFile(this.testPath),
            this.removeFile(this.lintPath),
        ]);
    }
}
