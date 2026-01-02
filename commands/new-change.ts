import fs from "node:fs";
import path from "node:path";
import { initializeStatus } from "../lib/task-status-tracker.js";
import { getCommandPrompt } from "./utils/prompt-reader.js";

const PROPOSAL_TEMPLATE = `# Change: {{name}}

> Brief description of what this change accomplishes

## Why

[Motivation and problem being solved]

## What Changes

[Description of changes to be made]

## Impact

- **Affected specs**: 
- **Affected code**: 
- **Risk level**: [Low/Medium/High]
`;

const TASKS_TEMPLATE = `# Tasks

## Phase 1: [Phase Title]

- [ ] 1.1 [Task description] <!-- Risk: Tier-2 -->
- [ ] 1.2 [Task description] <!-- Risk: Tier-2 -->

## Phase 2: [Phase Title]

- [ ] 2.1 [Task description] <!-- Risk: Tier-3 -->
- [ ] 2.2 [Task description] <!-- Risk: Tier-2 -->

## Phase 3: Testing

- [ ] 3.1 Unit tests
- [ ] 3.2 Integration tests
`;

export interface NewChangeResult {
    success: boolean;
    path?: string;
    error?: string;
    prompt?: string;
}

/**
 * New-change command handler - creates a new change directory with templates
 */
export async function newChange(
    changesDir: string,
    name: string
): Promise<NewChangeResult> {
    const changeDir = path.join(changesDir, name);

    // Check if change already exists
    if (fs.existsSync(changeDir)) {
        return {
            success: false,
            error: `Change already exists: ${name}`,
        };
    }

    try {
        // Create directory structure
        fs.mkdirSync(path.join(changeDir, "specs"), { recursive: true });

        // Create proposal.md
        fs.writeFileSync(
            path.join(changeDir, "proposal.md"),
            PROPOSAL_TEMPLATE.replace(/\{\{name\}\}/g, name),
            "utf8"
        );

        // Create tasks.md
        fs.writeFileSync(path.join(changeDir, "tasks.md"), TASKS_TEMPLATE, "utf8");

        // Initialize status tracking
        initializeStatus(name);

        // Get the next-step prompt from new-change.md
        const prompt = getCommandPrompt("new-change") ?? undefined;

        return {
            success: true,
            path: changeDir,
            prompt,
        };
    } catch (error) {
        return {
            success: false,
            error: String(error),
        };
    }
}

// CLI handler
const isCLI = import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('new-change.ts');
if (isCLI) {
    const name = process.argv[2];
    if (!name) {
        console.error("Usage: new-change <name>");
        process.exit(1);
    }

    const changesDir = path.join(process.cwd(), "changes");
    newChange(changesDir, name).then((result) => {
        if (result.success) {
            console.log(`✅ Created change: ${result.path}`);
            // Output next-step prompt for Agent
            if (result.prompt) {
                console.log("\n📋 Next Steps:");
                console.log(result.prompt);
            }
        } else {
            console.error(`❌ Error: ${result.error}`);
            process.exit(1);
        }
    });
}

