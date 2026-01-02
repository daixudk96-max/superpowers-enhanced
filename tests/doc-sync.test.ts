import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock config-loader before importing doc-sync
vi.mock("../lib/config-loader.js", () => {
    const loadConfig = vi.fn();
    const hasApiKey = vi.fn();
    return { loadConfig, hasApiKey };
});

// Mock node:fs for file operations
vi.mock("node:fs", () => {
    const existsSync = vi.fn();
    const readFileSync = vi.fn();
    const writeFileSync = vi.fn();
    const statSync = vi.fn();
    const readdirSync = vi.fn();
    return {
        default: { existsSync, readFileSync, writeFileSync, statSync, readdirSync },
        existsSync,
        readFileSync,
        writeFileSync,
        statSync,
        readdirSync,
    };
});

import { formatDiffs, applyDocUpdates, syncContextDocs } from "../lib/doc-sync.js";
import { loadConfig, hasApiKey } from "../lib/config-loader.js";
import fs from "node:fs";

type MockFn = ReturnType<typeof vi.fn>;

const fsMock = fs as unknown as {
    existsSync: MockFn;
    readFileSync: MockFn;
    writeFileSync: MockFn;
    statSync: MockFn;
    readdirSync: MockFn;
};

const loadConfigMock = loadConfig as unknown as MockFn;
const hasApiKeyMock = hasApiKey as unknown as MockFn;

beforeEach(() => {
    vi.clearAllMocks();
    fsMock.existsSync.mockReturnValue(false);
    fsMock.readFileSync.mockReturnValue("");
    fsMock.writeFileSync.mockReturnValue(undefined);
    fsMock.statSync.mockReturnValue({ isDirectory: () => false });
    fsMock.readdirSync.mockReturnValue([]);
});

describe("formatDiffs", () => {
    it("returns unified diff for provided updates", () => {
        const updates = [
            {
                targetFile: "product.md",
                reason: "update",
                originalContent: "# Title\nOld line",
                updatedContent: "# Title\nNew line",
            },
        ];

        const diff = formatDiffs(updates);

        expect(diff).toContain("--- a/product.md");
        expect(diff).toContain("+++ b/product.md");
        expect(diff).toContain("-# Title");
        expect(diff).toContain("+# Title");
    });

    it("returns empty string when no updates", () => {
        expect(formatDiffs([])).toBe("");
    });

    it("handles multiple updates", () => {
        const updates = [
            {
                targetFile: "product.md",
                reason: "update 1",
                originalContent: "old1",
                updatedContent: "new1",
            },
            {
                targetFile: "tech-stack.md",
                reason: "update 2",
                originalContent: "old2",
                updatedContent: "new2",
            },
        ];

        const diff = formatDiffs(updates);

        expect(diff).toContain("--- a/product.md");
        expect(diff).toContain("--- a/tech-stack.md");
    });
});

describe("applyDocUpdates", () => {
    it("writes updated content to target paths", () => {
        const updates = [
            {
                targetFile: "product.md",
                reason: "update",
                originalContent: "old",
                updatedContent: "new content",
            },
        ];
        const contextDir = "/repo/context";

        applyDocUpdates(updates, contextDir);

        expect(fsMock.writeFileSync).toHaveBeenCalledTimes(1);
        expect(fsMock.writeFileSync).toHaveBeenCalledWith(
            path.join(contextDir, "product.md"),
            "new content",
            "utf8"
        );
    });

    it("writes multiple files", () => {
        const updates = [
            {
                targetFile: "product.md",
                reason: "r1",
                originalContent: "o1",
                updatedContent: "n1",
            },
            {
                targetFile: "workflow.md",
                reason: "r2",
                originalContent: "o2",
                updatedContent: "n2",
            },
        ];

        applyDocUpdates(updates, "/context");

        expect(fsMock.writeFileSync).toHaveBeenCalledTimes(2);
    });
});

describe("syncContextDocs edge cases", () => {
    it("returns empty array when no API key", async () => {
        hasApiKeyMock.mockReturnValue(false);
        loadConfigMock.mockReturnValue({ provider: { provider: "anthropic" } });

        const result = await syncContextDocs({
            changeDir: "/changes/foo",
            contextDir: "/context",
        });

        expect(result).toEqual([]);
        expect(hasApiKeyMock).toHaveBeenCalled();
    });

    it("returns empty array when proposal.md is missing", async () => {
        hasApiKeyMock.mockReturnValue(true);
        loadConfigMock.mockReturnValue({ provider: { provider: "anthropic", apiKey: "test" } });
        fsMock.existsSync.mockReturnValue(false);
        fsMock.readFileSync.mockReturnValue("");

        const result = await syncContextDocs({
            changeDir: "/changes/foo",
            contextDir: "/context",
        });

        expect(result).toEqual([]);
    });
});
