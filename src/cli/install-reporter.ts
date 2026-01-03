import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectTechStack } from "../../lib/tech-detector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fusionRoot = path.resolve(__dirname, "../../..");

const VITEST_CONFIG_PATTERNS = ["vitest.config.ts", "vitest.config.js", "vitest.config.mts"];

function ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true });
}

function normalizeImportPath(relativePath: string): string {
    const normalized = relativePath.split(path.sep).join("/");
    return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function resolveReporterSource(relBasePath: string): string | null {
    const candidates = [
        path.join(fusionRoot, "dist", `${relBasePath}.js`),
        path.join(fusionRoot, `${relBasePath}.js`),
        path.join(fusionRoot, "dist", `${relBasePath}.ts`),
        path.join(fusionRoot, `${relBasePath}.ts`),
        path.join(fusionRoot, `${relBasePath}.py`),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function copyReporter(relBasePath: string, preferredBaseName?: string): string | null {
    const source = resolveReporterSource(relBasePath);
    if (!source) return null;

    const ext = path.extname(source);
    const destDir = path.join(process.cwd(), ".fusion", "reporters");
    ensureDir(destDir);

    const baseName = preferredBaseName ? `${preferredBaseName}${ext}` : path.basename(source);
    const destPath = path.join(destDir, baseName);
    fs.copyFileSync(source, destPath);
    return destPath;
}

function findVitestConfig(projectDir: string): string | null {
    for (const pattern of VITEST_CONFIG_PATTERNS) {
        const configPath = path.join(projectDir, pattern);
        if (fs.existsSync(configPath)) {
            return configPath;
        }
    }
    return null;
}

function installVitestReporter(configPath: string, reporterPath: string): boolean {
    let content = fs.readFileSync(configPath, "utf-8");

    if (content.includes("FusionVitestReporter")) {
        console.log("✓ Fusion Vitest reporter already configured");
        return true;
    }

    const relativeImport = normalizeImportPath(path.relative(path.dirname(configPath), reporterPath));
    const reporterImport = `import FusionVitestReporter from '${relativeImport}';\n`;
    const reporterConfig = `
  reporters: [
    'default',
    new FusionVitestReporter(),
  ],`;

    const importMatch = content.match(/^import .+;\n/gm);
    if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        content = content.replace(lastImport, `${lastImport}${reporterImport}`);
    } else {
        content = `${reporterImport}\n${content}`;
    }

    if (content.includes("defineConfig")) {
        const configMatch = content.match(/defineConfig\s*\(\s*{/);
        if (configMatch && configMatch.index !== undefined) {
            const insertPos = configMatch.index + configMatch[0].length;
            content = content.slice(0, insertPos) + reporterConfig + content.slice(insertPos);
        }
    }

    fs.writeFileSync(configPath, content, "utf-8");
    console.log(`✓ Updated ${path.basename(configPath)} with Fusion reporter`);
    return true;
}

function printJestInstructions(reporterPath: string): void {
    const normalized = normalizeImportPath(path.relative(process.cwd(), reporterPath));
    console.log("\nAdd to your Jest config:");
    console.log(`
// jest.config.js or jest.config.cjs
module.exports = {
  reporters: [
    "default",
    "<rootDir>/${normalized}"
  ]
};`);
}

function printPytestInstructions(): void {
    console.log("\nAdd to your Pytest invocation or config:");
    console.log("  pytest -p .fusion.reporters.pytest_reporter");
}

export function installReporterCommand(): void {
    const projectDir = process.cwd();
    console.log("Superpowers-Fusion Reporter Installer\n");

    const stack = detectTechStack(projectDir);
    console.log(`Detected language: ${stack.language}`);
    console.log(`Detected test runner: ${stack.testRunner ?? "unknown"}`);

    if (stack.language === "typescript" || stack.language === "javascript") {
        if (stack.testRunner === "vitest") {
            const reporterPath = copyReporter("lib/vitest-reporter", "vitest-reporter");
            if (!reporterPath) {
                console.log("⚠️  Could not locate Vitest reporter to copy.");
                return;
            }
            const configPath = findVitestConfig(projectDir);
            if (!configPath) {
                console.log("⚠️  No vitest.config.* found. Create one first (npx vitest init).");
                console.log(`Reporter copied to: ${reporterPath}`);
                console.log("Import path to use:", normalizeImportPath(path.relative(projectDir, reporterPath)));
                return;
            }

            installVitestReporter(configPath, reporterPath);
            console.log(`Reporter copied to: ${reporterPath}`);
        } else if (stack.testRunner === "jest") {
            const reporterPath = copyReporter("lib/reporters/jest-reporter", "jest-reporter");
            if (!reporterPath) {
                console.log("⚠️  Could not locate Jest reporter to copy.");
                return;
            }
            console.log(`✓ Copied reporter to ${reporterPath}`);
            printJestInstructions(reporterPath);
        } else {
            console.log("⚠️  No supported JS/TS test runner detected (Vitest/Jest).");
        }
        return;
    }

    if (stack.language === "python") {
        const reporterPath = copyReporter("lib/reporters/python/pytest_reporter");
        if (!reporterPath) {
            console.log("⚠️  Could not locate Pytest reporter to copy.");
            return;
        }
        console.log(`✓ Copied reporter to ${reporterPath}`);
        printPytestInstructions();
        return;
    }

    console.log("ℹ️  Reporter installation is currently available for Vitest, Jest, and Pytest.");
}
