/**
 * GuardManager - Runtime TDD guard control
 *
 * Controls whether TDD is enforced at runtime, independent of .env settings.
 * Persists toggle state in .fusion/config.json and respects ignore patterns.
 *
 * Adapted from tdd-guard/src/guard/GuardManager.ts (84 lines)
 */

import { minimatch } from "minimatch";
import { loadConfig } from "./config-loader.js";
import { GuardConfigSchema, type GuardConfig } from "./schemas.js";
import { FileStorage, type Storage } from "./storage.js";

/**
 * GuardManager controls runtime TDD guard enablement and ignore rules.
 * 
 * Priority: Runtime config (.fusion/config.json) > .env defaults
 */
export class GuardManager {
    private readonly storage: Storage;
    private readonly runtimeConfig = loadConfig();

    /**
     * Create a GuardManager instance
     * @param storage - Storage implementation, defaults to FileStorage
     */
    constructor(storage?: Storage) {
        this.storage = storage ?? new FileStorage(this.runtimeConfig.fusionStateDir);
    }

    /**
     * Check whether TDD guard is enabled
     * 
     * Priority:
     * 1. Runtime config override (.fusion/config.json)
     * 2. Environment variable (TDD_VALIDATION_ENABLED)
     */
    async isEnabled(): Promise<boolean> {
        const guardConfig = await this.readGuardConfig();
        if (typeof guardConfig.guardEnabled === "boolean") {
            return guardConfig.guardEnabled;
        }
        return this.runtimeConfig.tdd.enabled;
    }

    /** Enable TDD guard and persist to config */
    async enable(): Promise<void> {
        await this.writeGuardConfig({ guardEnabled: true });
        console.log("[GuardManager] TDD Guard enabled");
    }

    /** Disable TDD guard and persist to config */
    async disable(): Promise<void> {
        await this.writeGuardConfig({ guardEnabled: false });
        console.log("[GuardManager] TDD Guard disabled");
    }

    /** Toggle TDD guard state, returning the new state */
    async toggle(): Promise<boolean> {
        const current = await this.isEnabled();
        const next = !current;
        await this.writeGuardConfig({ guardEnabled: next });
        console.log(`[GuardManager] TDD Guard ${next ? "enabled" : "disabled"}`);
        return next;
    }

    /**
     * Determine if a file should be ignored based on glob patterns
     * 
     * Combines patterns from:
     * 1. .env (TDD_IGNORE_PATTERNS)
     * 2. Runtime config (.fusion/config.json)
     */
    async shouldIgnoreFile(filePath: string): Promise<boolean> {
        const guardConfig = await this.readGuardConfig();

        // Combine patterns from config and runtime override
        const patterns = [
            ...this.runtimeConfig.tdd.ignorePatterns,
            ...(guardConfig.ignorePatterns ?? []),
        ];

        // Check if file matches any pattern
        return patterns.some((pattern) =>
            minimatch(filePath, pattern, { dot: true, matchBase: true })
        );
    }

    /**
     * Add an ignore pattern at runtime
     */
    async addIgnorePattern(pattern: string): Promise<void> {
        const config = await this.readGuardConfig();
        const patterns = config.ignorePatterns ?? [];
        if (!patterns.includes(pattern)) {
            patterns.push(pattern);
            await this.writeGuardConfig({ ...config, ignorePatterns: patterns });
        }
    }

    // --- Private helpers ---

    private async readGuardConfig(): Promise<GuardConfig> {
        const raw = await this.storage.getConfig();
        if (!raw) return {};

        try {
            const parsed = JSON.parse(raw);
            return GuardConfigSchema.parse(parsed);
        } catch (error) {
            console.warn("[GuardManager] Failed to parse guard config, using defaults:", error);
            return {};
        }
    }

    private async writeGuardConfig(config: GuardConfig): Promise<void> {
        const current = await this.readGuardConfig();
        const merged = { ...current, ...config };
        await this.storage.saveConfig(JSON.stringify(merged, null, 2));
    }
}
