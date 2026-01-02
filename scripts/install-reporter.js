#!/usr/bin/env node

/**
 * Superpowers-Fusion Vitest Reporter Installer
 *
 * Usage: npx superpowers-fusion install-reporter
 *
 * This script:
 * 1. Detects if the project uses Vitest or Jest
 * 2. Updates vitest.config.ts to include the Fusion reporter
 * 3. Adds necessary dev dependencies
 */

import fs from "node:fs";
import path from "node:path";

const VITEST_CONFIG_PATTERNS = ["vitest.config.ts", "vitest.config.js", "vitest.config.mts"];

const REPORTER_IMPORT = `import FusionVitestReporter from 'superpowers-fusion/lib/vitest-reporter';`;

const REPORTER_CONFIG = `
  reporters: [
    'default',
    new FusionVitestReporter(),
  ],`;

function findVitestConfig(projectDir) {
    for (const pattern of VITEST_CONFIG_PATTERNS) {
        const configPath = path.join(projectDir, pattern);
        if (fs.existsSync(configPath)) {
            return configPath;
        }
    }
    return null;
}

function detectTestFramework(projectDir) {
    const packageJsonPath = path.join(projectDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    if (deps.vitest) return "vitest";
    if (deps.jest) return "jest";
    return null;
}

function installVitestReporter(configPath) {
    let content = fs.readFileSync(configPath, "utf-8");

    // Check if already installed
    if (content.includes("FusionVitestReporter")) {
        console.log("✓ Fusion reporter already configured");
        return true;
    }

    // Add import at the top (after other imports)
    const importMatch = content.match(/^import .+;\n/gm);
    if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        content = content.replace(lastImport, `${lastImport}${REPORTER_IMPORT}\n`);
    } else {
        content = `${REPORTER_IMPORT}\n\n${content}`;
    }

    // Add reporter config inside defineConfig
    if (content.includes("defineConfig")) {
        // Try to add reporters array
        const configMatch = content.match(/defineConfig\s*\(\s*{/);
        if (configMatch) {
            const insertPos = configMatch.index + configMatch[0].length;
            content = content.slice(0, insertPos) + REPORTER_CONFIG + content.slice(insertPos);
        }
    }

    fs.writeFileSync(configPath, content, "utf-8");
    console.log(`✓ Updated ${path.basename(configPath)} with Fusion reporter`);
    return true;
}

function main() {
    const projectDir = process.cwd();

    console.log("Superpowers-Fusion Reporter Installer\n");

    // Detect test framework
    const framework = detectTestFramework(projectDir);
    if (!framework) {
        console.log("⚠️  No test framework detected. Install Vitest or Jest first.");
        process.exit(1);
    }

    console.log(`Detected: ${framework}\n`);

    if (framework === "vitest") {
        const configPath = findVitestConfig(projectDir);
        if (!configPath) {
            console.log("⚠️  No vitest.config.ts found. Create one first.");
            console.log("   Run: npx vitest init");
            process.exit(1);
        }

        installVitestReporter(configPath);
    } else if (framework === "jest") {
        console.log("ℹ️  Jest reporter integration is not yet implemented.");
        console.log("   Please add the reporter manually to your jest.config.js.");
        process.exit(0);
    }

    console.log("\n✅ Done! Run your tests to see Fusion test results in .fusion/test-results.json");
}

main();
