/**
 * Technology Stack Detector
 *
 * Detects whether a project is brownfield (existing) or greenfield (new),
 * and automatically detects the technology stack from project files.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Information about whether a project is brownfield (existing)
 */
export interface BrownfieldInfo {
    /** True if project has existing code/structure */
    isBrownfield: boolean;
    /** List of indicators that determined brownfield status */
    indicators: string[];
}

/**
 * Detected technology stack information
 */
export type SupportedLanguage =
    | "typescript"
    | "javascript"
    | "python"
    | "go"
    | "ruby"
    | "rust"
    | "php"
    | "java"
    | "unknown";

export interface TechStack {
    /** Primary programming language */
    language: SupportedLanguage;
    /** Detected frameworks (React, Vue, Next.js, etc.) */
    frameworks: string[];
    /** Test runner (vitest, jest, etc.) */
    testRunner: string | null;
    /** Build tool (vite, webpack, etc.) */
    buildTool: string | null;
}

/**
 * Check if a path exists relative to project directory
 */
function hasPath(projectDir: string, relativePath: string): boolean {
    const target = path.join(projectDir, relativePath);
    try {
        return fs.existsSync(target);
    } catch {
        return false;
    }
}

/**
 * Read and parse a JSON file if it exists
 */
function readJsonIfExists(filePath: string): Record<string, unknown> | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/**
 * Read file content safely
 */
function readFileIfExists(filePath: string): string | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        return fs.readFileSync(filePath, "utf8");
    } catch {
        return null;
    }
}

/**
 * Check if a file contains a keyword (case-insensitive by default)
 */
function fileContains(projectDir: string, relativePath: string, keyword: string | RegExp): boolean {
    const target = path.join(projectDir, relativePath);
    const content = readFileIfExists(target);
    if (content === null) {
        return false;
    }

    if (keyword instanceof RegExp) {
        return keyword.test(content);
    }
    return content.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Collect all dependencies from package.json
 */
function collectDependencies(pkg: Record<string, unknown> | null): Set<string> {
    const deps = new Set<string>();
    if (!pkg) return deps;

    const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
    for (const section of sections) {
        const value = pkg[section];
        if (value && typeof value === "object") {
            for (const name of Object.keys(value as Record<string, unknown>)) {
                deps.add(name);
            }
        }
    }

    return deps;
}

/**
 * Detect if a project is brownfield (existing) or greenfield (new).
 *
 * @param projectDir - Root directory of the project
 * @returns Brownfield detection result with indicators
 *
 * @example
 * ```ts
 * const result = detectBrownfield("/path/to/project");
 * if (result.isBrownfield) {
 *   console.log("Existing project detected:", result.indicators);
 * }
 * ```
 */
export function detectBrownfield(projectDir: string): BrownfieldInfo {
    const indicators: string[] = [];

const checks: Array<[string, string]> = [
    [".git", ".git directory"],
    ["package.json", "package.json"],
    ["src", "src directory"],
    ["app", "app directory"],
    ["lib", "lib directory"],
    ["tsconfig.json", "tsconfig.json"],
    ["requirements.txt", "requirements.txt"],
    ["pyproject.toml", "pyproject.toml"],
    ["pom.xml", "pom.xml"],
    ["go.mod", "go.mod"],
    ["Gemfile", "Gemfile"],
    ["Cargo.toml", "Cargo.toml"],
    ["composer.json", "composer.json"],
];

    for (const [relative, label] of checks) {
        if (hasPath(projectDir, relative)) {
            indicators.push(label);
        }
    }

    return {
        isBrownfield: indicators.length > 0,
        indicators,
    };
}

/**
 * Detect the technology stack of a project.
 *
 * @param projectDir - Root directory of the project
 * @returns Detected technology stack
 *
 * @example
 * ```ts
 * const stack = detectTechStack("/path/to/project");
 * console.log(stack.language);    // "typescript"
 * console.log(stack.frameworks);  // ["react", "next"]
 * console.log(stack.testRunner);  // "vitest"
 * ```
 */
export function detectTechStack(projectDir: string): TechStack {
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = readJsonIfExists(pkgPath);
    const deps = collectDependencies(pkg);

    // Detect language via marker files first
    const markerLanguage = detectLanguageByMarkers(projectDir);

    // Detect language
    const tsconfigExists = hasPath(projectDir, "tsconfig.json");
    const language: TechStack["language"] =
        markerLanguage ??
        (tsconfigExists || deps.has("typescript")
            ? "typescript"
            : deps.size > 0
                ? "javascript"
                : "unknown");

    // Detect frameworks
    const frameworks: string[] = [];
    const frameworkCandidates = [
        "next",
        "react",
        "vue",
        "nuxt",
        "svelte",
        "astro",
        "express",
        "koa",
        "fastify",
        "@nestjs/core",
        "remix",
        "gatsby",
        "solid-start",
        "hono",
    ];
    for (const candidate of frameworkCandidates) {
        if (deps.has(candidate)) {
            frameworks.push(candidate.replace("@nestjs/core", "nestjs"));
        }
    }

    // Detect build tool (first match wins)
    const buildToolsOrder = ["vite", "webpack", "rollup", "parcel", "turbo", "rspack", "esbuild"];
    const buildTool = buildToolsOrder.find((tool) => deps.has(tool)) ?? null;

    // Detect test runner (first match wins)
    const testRunnersOrder = ["vitest", "jest", "mocha", "ava", "@playwright/test", "cypress"];
    let testRunner =
        testRunnersOrder.find((runner) => deps.has(runner))?.replace("@playwright/test", "playwright") ?? null;

    if (language === "python") {
        const hasPytest =
            hasPath(projectDir, "pytest.ini") ||
            fileContains(projectDir, "requirements.txt", "pytest") ||
            fileContains(projectDir, "pyproject.toml", "pytest");
        testRunner = hasPytest ? "pytest" : null;
    } else if (language === "go") {
        testRunner = "go test";
    } else if (language === "ruby") {
        testRunner = fileContains(projectDir, "Gemfile", "rspec") ? "rspec" : null;
    } else if (language === "rust") {
        testRunner = "cargo test";
    } else if (language === "php") {
        testRunner = fileContains(projectDir, "composer.json", "phpunit") ? "phpunit" : null;
    } else if (language === "java") {
        testRunner = "junit";
    }

    return {
        language,
        frameworks,
        testRunner,
        buildTool,
    };
}

function detectLanguageByMarkers(projectDir: string): SupportedLanguage | null {
    const markers: Array<[SupportedLanguage, string[]]> = [
        ["python", ["pyproject.toml", "requirements.txt"]],
        ["go", ["go.mod"]],
        ["ruby", ["Gemfile"]],
        ["rust", ["Cargo.toml"]],
        ["php", ["composer.json"]],
        ["java", ["pom.xml", "build.gradle", "build.gradle.kts"]],
    ];

    for (const [language, files] of markers) {
        if (files.some((file) => hasPath(projectDir, file))) {
            return language;
        }
    }

    return null;
}
