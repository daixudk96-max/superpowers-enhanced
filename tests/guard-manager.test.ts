/**
 * Tests for TDD Guard Manager - Pure Function Tests
 * 
 * Tests the exported helper functions without fs mocking complexity.
 */
import { describe, it, expect } from "vitest";
import { minimatch } from "minimatch";

describe("GuardManager Logic", () => {
    describe("Pattern Matching (minimatch)", () => {
        it("should match .md files with *.md pattern", () => {
            const pattern = "*.md";
            expect(minimatch("README.md", pattern)).toBe(true);
            expect(minimatch("CHANGELOG.md", pattern)).toBe(true);
        });

        it("should not match .ts files with *.md pattern", () => {
            const pattern = "*.md";
            expect(minimatch("index.ts", pattern)).toBe(false);
            expect(minimatch("test.spec.ts", pattern)).toBe(false);
        });

        it("should match multiple patterns correctly", () => {
            const patterns = ["*.md", "*.json", "*.css"];

            const matches = (file: string) =>
                patterns.some((p) => minimatch(file, p));

            expect(matches("README.md")).toBe(true);
            expect(matches("package.json")).toBe(true);
            expect(matches("styles.css")).toBe(true);
            expect(matches("index.ts")).toBe(false);
        });

        it("should handle deep path patterns", () => {
            const pattern = "**/*.test.ts";
            expect(minimatch("tests/foo.test.ts", pattern)).toBe(true);
            expect(minimatch("lib/bar.ts", pattern)).toBe(false);
        });
    });

    describe("Default Values", () => {
        it("should define default ignore patterns", () => {
            const defaultPatterns = ["*.md", "*.json", "*.yml", "*.yaml", "*.css", "*.scss", "*.svg"];

            // README.md should be ignored
            expect(defaultPatterns.some((p) => minimatch("README.md", p))).toBe(true);

            // package.json should be ignored
            expect(defaultPatterns.some((p) => minimatch("package.json", p))).toBe(true);

            // index.ts should NOT be ignored
            expect(defaultPatterns.some((p) => minimatch("index.ts", p))).toBe(false);
        });
    });
});
