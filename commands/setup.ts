import fs from "node:fs";
import path from "node:path";

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
}

/**
 * Setup command handler - creates context directory with templates
 */
export async function setup(projectDir: string): Promise<SetupResult> {
    const contextDir = path.join(projectDir, "context");
    const created: string[] = [];
    const skipped: string[] = [];

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

    return { created, skipped };
}

// CLI handler
if (import.meta.url === `file://${process.argv[1]}`) {
    const projectDir = process.cwd();
    setup(projectDir).then((result) => {
        if (result.created.length > 0) {
            console.log("✅ Created context files:");
            result.created.forEach((f) => console.log(`   - context/${f}`));
        }
        if (result.skipped.length > 0) {
            console.log("⏭️  Skipped (already exist):");
            result.skipped.forEach((f) => console.log(`   - context/${f}`));
        }
    });
}
