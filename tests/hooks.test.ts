import { describe, it, expect, vi, beforeEach } from "vitest";
import { preToolEdit } from "../hooks/preToolEdit.js";
import { determineRiskTier } from "../lib/risk-validator.js";
import { loadConfig } from "../lib/config-loader.js";

// Mock config to ensure TDD is enabled
vi.mock("../lib/config-loader.js", () => ({
    loadConfig: vi.fn(() => ({
        tdd: {
            enabled: true,
            client: "sdk", // Use SDK to avoid external API calls during test
            astChecks: true,
            rejectEmptyTests: false,
            rejectMissingAssertions: false,
            rejectTrivialAssertions: false,
        },
        provider: { provider: "anthropic" },
        fusionStateDir: ".fusion",
        logLevel: "info",
    })),
}));

describe("Risk Validator", () => {
    it("should identify Tier 0 files (docs)", () => {
        expect(determineRiskTier("README.md").tier).toBe(0);
        expect(determineRiskTier("LICENSE").tier).toBe(0);
    });

    it("should identify Tier 1 files (config/styles)", () => {
        expect(determineRiskTier("style.css").tier).toBe(1);
        expect(determineRiskTier("config.json").tier).toBe(1);
    });

    it("should identify Tier 3 files (core logic)", () => {
        expect(determineRiskTier("src/api/user.ts").tier).toBe(3);
        expect(determineRiskTier("src/auth/login.ts").tier).toBe(3);
    });

    it("should default to Tier 2 for others", () => {
        expect(determineRiskTier("src/utils/helper.ts").tier).toBe(2);
        expect(determineRiskTier("components/Button.tsx").tier).toBe(2);
    });
});

describe("PreToolEdit Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should allow editing test files always", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "src/utils/helper.test.ts",
            content: "test code",
        });
        expect(result.allowed).toBe(true);
    });

    it("should allow Tier 0 files without checks", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "docs/guide.md",
            content: "docs",
        });
        expect(result.allowed).toBe(true);
        expect(result.tier).toBe(0);
    });

    it("should block Tier 3 edits if no failing test", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "src/api/core.ts", // Tier 3
            content: "code",
            hasFailingTest: false,
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Tier 3");
    });

    it("should allow Tier 3 edits if failing test exists", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "src/api/core.ts", // Tier 3
            content: "code",
            hasFailingTest: true,
        });
        expect(result.allowed).toBe(true);
    });

    it("should block Tier 2 edits if no test and no exemption", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "src/components/List.tsx", // Tier 2
            content: "code",
            hasFailingTest: false,
            hasExemption: false,
        });
        // With AI validation mocked/disabled (or SDK default approve), this might pass or fail depending on implementation details.
        // However, our mock config uses "sdk" which defaults to "approve" in api-client.ts placeholder.
        // But wait, api-client.ts validates *only if* blockResult.blocked is true.
        // In preToolEdit.ts:
        // Tier 2 -> blockResult.blocked = true (if no test/exemption)
        // Then it calls validateWithAI because client="api" is FALSE (mocked as "sdk")?? 
        // Wait, let's check preToolEdit.ts logic again.

        // Logic: if (tier === 2 && config.tdd.client === "api" ...)
        // If client is "sdk", it won't trigger AI validation *inside* preToolEdit's current implementation logic for Tier 2 fallback?
        // Let's re-read preToolEdit.ts.

        // Verified: The fallback logic in `preToolEdit.ts` specifically checks `config.tdd.client === "api"`.
        // So if client="sdk", it simply returns blocked.

        expect(result.allowed).toBe(false);
    });

    it("should allow Tier 2 edits with exemption comment", async () => {
        const result = await preToolEdit({
            toolName: "replace_file_content",
            filePath: "src/components/Legacy.tsx", // Tier 2
            content: "// TDD-EXEMPT: Legacy code\nexport const x = 1;",
            hasFailingTest: false,
        });
        expect(result.allowed).toBe(true);
    });
});
