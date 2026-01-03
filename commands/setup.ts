import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
    detectBrownfield,
    detectTechStack,
    type BrownfieldInfo,
    type TechStack,
} from "../lib/tech-detector.js";
import { getCommandPrompt } from "./utils/prompt-reader.js";

const TEMPLATES = {
    "product.md": `# Product Context

## Name

[Your product name]

## Description

[One paragraph describing what this product does and who it's for]

## Target Users

- **User Type 1**: [Description of this user type]
- **User Type 2**: [Description of this user type]

## Core Features

1. **Feature A**: [Description]
2. **Feature B**: [Description]
3. **Feature C**: [Description]

## Success Metrics (KPIs)

| Metric | Target | Current |
|--------|--------|---------|
| Metric 1 | [target] | - |
| Metric 2 | [target] | - |
`,

    "tech-stack.md": `# Tech Stack

## Languages

- **Primary**: [Language + version, e.g., TypeScript 5.4]
- **Secondary**: [Language + version]

## Frameworks

- **Frontend**: [Framework + version]
- **Backend**: [Framework + version]
- **Testing**: [Framework, e.g., Vitest, Jest, pytest]

## Data

- **Database**: [Database + version]
- **Cache**: [Cache solution]
- **Search**: [Search engine]

## Infrastructure

- **Cloud**: [Provider, e.g., AWS, GCP, Azure]
- **CI/CD**: [Tool, e.g., GitHub Actions]
- **Monitoring**: [Tool, e.g., Datadog, Sentry]

## Development Tools

- **Package Manager**: [npm, yarn, pnpm]
- **Linting**: [ESLint, Prettier]
- **IDE**: [VS Code, etc.]
`,

    "workflow.md": `# Workflow

## Branching Strategy

[Choose: Git Flow / GitHub Flow / Trunk-based]

| Branch | Purpose |
|--------|---------|
| main | Production-ready code |
| develop | Integration branch |
| feature/* | New features |
| fix/* | Bug fixes |
| release/* | Release preparation |

## Code Review

- **Required Approvals**: [number]
- **Auto-merge**: [yes/no]
- **Required Checks**: [tests, lint, build]

## CI/CD Pipeline

### On Pull Request
1. Run tests
2. Run linters
3. Build check

### On Merge to Main
1. Run full test suite
2. Build production bundle
3. Deploy to staging
4. [Manual approval for prod]

## Release Process

1. Create release branch from develop
2. Update version and changelog
3. Merge to main
4. Tag release
5. Deploy to production
`,
};

export interface SetupResult {
    created: string[];
    skipped: string[];
    prompt?: string;
    detection?: {
        brownfield: BrownfieldInfo;
        techStack: TechStack;
    };
}

export interface SetupOptions {
    /** Run in interactive mode (default: true) */
    interactive?: boolean;
}

/**
 * Detect project context and optionally confirm with user
 */
async function detectAndConfirm(
    projectDir: string,
    interactive: boolean
): Promise<{ brownfield: BrownfieldInfo; techStack: TechStack }> {
    const brownfield = detectBrownfield(projectDir);
    let techStack = detectTechStack(projectDir);

    // Non-interactive mode: return detected values directly
    if (!interactive) {
        console.log("📊 Project Detection (non-interactive):");
        console.log(`   - Brownfield: ${brownfield.isBrownfield ? "yes" : "no"}`);
        console.log(`   - Language: ${techStack.language}`);
        console.log(`   - Frameworks: ${techStack.frameworks.join(", ") || "none"}`);
        console.log(`   - Test runner: ${techStack.testRunner ?? "unknown"}`);
        console.log(`   - Build tool: ${techStack.buildTool ?? "unknown"}`);
        return { brownfield, techStack };
    }

    // Interactive mode: show detection and allow user to modify
    const rl = readline.createInterface({ input, output });

    const ask = async (label: string, current: string): Promise<string> => {
        const suffix = current ? ` [${current}]` : "";
        const answer = await rl.question(`${label}${suffix}: `);
        return answer.trim() === "" ? current : answer.trim();
    };

    console.log("\n📊 Detected project context:");
    console.log(
        `   - Brownfield: ${brownfield.isBrownfield ? "yes" : "no"}${brownfield.indicators.length ? ` (${brownfield.indicators.join(", ")})` : ""
        }`
    );
    console.log(`   - Language: ${techStack.language}`);
    console.log(`   - Frameworks: ${techStack.frameworks.join(", ") || "none"}`);
    console.log(`   - Test runner: ${techStack.testRunner ?? "unknown"}`);
    console.log(`   - Build tool: ${techStack.buildTool ?? "unknown"}`);

    console.log("\n📝 Press Enter to accept detected values, or type to override:\n");

    try {
        const languageInput = (
            await ask(
                "Language (typescript/javascript/python/go/ruby/rust/php/java/unknown)",
                techStack.language
            )
        ).toLowerCase();

        const allowedLanguages: TechStack["language"][] = [
            "typescript",
            "javascript",
            "python",
            "go",
            "ruby",
            "rust",
            "php",
            "java",
            "unknown",
        ];
        const normalizedLanguage: TechStack["language"] = allowedLanguages.includes(
            languageInput as TechStack["language"]
        )
            ? (languageInput as TechStack["language"])
            : techStack.language;

        const frameworksInput = await ask(
            "Frameworks (comma-separated)",
            techStack.frameworks.join(", ")
        );
        const frameworks = frameworksInput
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);

        const testRunnerInput = await ask("Test runner", techStack.testRunner ?? "");
        const buildToolInput = await ask("Build tool", techStack.buildTool ?? "");

        techStack = {
            language: normalizedLanguage,
            frameworks,
            testRunner: testRunnerInput || null,
            buildTool: buildToolInput || null,
        };

        return { brownfield, techStack };
    } finally {
        rl.close();
    }
}

/**
 * Setup command handler - creates context directory with templates
 */
export async function setup(
    projectDir: string,
    options: SetupOptions = {}
): Promise<SetupResult> {
    const interactive = options.interactive ?? true;
    const contextDir = path.join(projectDir, "context");
    const created: string[] = [];
    const skipped: string[] = [];

    // Detect project context
    const detection = await detectAndConfirm(projectDir, interactive);

    // Ensure state directories exist
    const fusionDir = path.join(projectDir, ".fusion");
    if (!fs.existsSync(fusionDir)) {
        fs.mkdirSync(fusionDir, { recursive: true });
        console.log("📁 Created .fusion/ directory");
    }

    const changesDir = path.join(projectDir, "changes");
    if (!fs.existsSync(changesDir)) {
        fs.mkdirSync(changesDir, { recursive: true });
        console.log("📁 Created changes/ directory");
    }

    // Create context directory if not exists
    if (!fs.existsSync(contextDir)) {
        fs.mkdirSync(contextDir, { recursive: true });
    }

    // Create template files
    for (const [filename, content] of Object.entries(TEMPLATES)) {
        const filepath = path.join(contextDir, filename);

        if (fs.existsSync(filepath)) {
            skipped.push(filename);
        } else {
            fs.writeFileSync(filepath, content, "utf8");
            created.push(filename);
        }
    }

    // Get the next-step prompt from setup.md
    const prompt = getCommandPrompt("setup") ?? undefined;

    return { created, skipped, prompt, detection };
}

// CLI handler
const isCLI =
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("setup.ts");

if (isCLI) {
    const projectDir = process.cwd();
    const interactive = !process.argv.includes("--no-interactive");

    setup(projectDir, { interactive }).then((result) => {
        if (result.created.length > 0) {
            console.log("\n✅ Created context files:");
            result.created.forEach((f) => console.log(`   - context/${f}`));
        }
        if (result.skipped.length > 0) {
            console.log("⏭️  Skipped (already exist):");
            result.skipped.forEach((f) => console.log(`   - context/${f}`));
        }
        // Output next-step prompt for Agent
        if (result.prompt) {
            console.log("\n📋 Next Steps:");
            console.log(result.prompt);
        }
    });
}
