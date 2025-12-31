#!/usr/bin/env node
/**
 * Superpowers-Fusion CLI
 *
 * Provides the `superpowers-fusion init` command to initialize
 * a project with TDD hooks, skills, and commands.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InitOptions {
    force?: boolean;
    skipHooks?: boolean;
    skipSkills?: boolean;
}

interface InitResult {
    success: boolean;
    created: string[];
    skipped: string[];
    errors: string[];
}

/**
 * Initialize a project with superpowers-fusion
 */
export async function init(
    projectDir: string = process.cwd(),
    options: InitOptions = {}
): Promise<InitResult> {
    const result: InitResult = {
        success: true,
        created: [],
        skipped: [],
        errors: []
    };

    const fusionRoot = path.resolve(__dirname, '../..');
    const claudeDir = path.join(projectDir, '.claude');

    try {
        // 1. Create .claude directory structure
        const dirs = [
            claudeDir,
            path.join(claudeDir, 'skills'),
            path.join(claudeDir, 'commands'),
            path.join(claudeDir, 'hooks')
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                result.created.push(dir);
            }
        }

        // 2. Copy skills (if not skipped)
        if (!options.skipSkills) {
            const skillsSource = path.join(fusionRoot, 'skills');
            const skillsDest = path.join(claudeDir, 'skills');

            if (fs.existsSync(skillsSource)) {
                const skills = fs.readdirSync(skillsSource);
                for (const skill of skills) {
                    const srcPath = path.join(skillsSource, skill);
                    const destPath = path.join(skillsDest, skill);

                    if (fs.statSync(srcPath).isDirectory()) {
                        if (!fs.existsSync(destPath) || options.force) {
                            copyDirSync(srcPath, destPath);
                            result.created.push(destPath);
                        } else {
                            result.skipped.push(destPath);
                        }
                    }
                }
            }
        }

        // 3. Create TDD hook
        if (!options.skipHooks) {
            const hookPath = path.join(claudeDir, 'hooks', 'edit.js');

            if (!fs.existsSync(hookPath) || options.force) {
                const hookContent = generateEditHook();
                fs.writeFileSync(hookPath, hookContent);
                result.created.push(hookPath);
            } else {
                result.skipped.push(hookPath);
            }
        }

        // 4. Create or update CLAUDE.md
        const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
        const fusionSection = generateClaudeMdSection();

        if (fs.existsSync(claudeMdPath)) {
            const existing = fs.readFileSync(claudeMdPath, 'utf8');
            if (!existing.includes('superpowers-fusion')) {
                fs.appendFileSync(claudeMdPath, '\n' + fusionSection);
                result.created.push(claudeMdPath + ' (updated)');
            } else {
                result.skipped.push(claudeMdPath);
            }
        } else {
            fs.writeFileSync(claudeMdPath, fusionSection);
            result.created.push(claudeMdPath);
        }

        // 5. Create .fusion directory for state
        const fusionStateDir = path.join(projectDir, '.fusion');
        if (!fs.existsSync(fusionStateDir)) {
            fs.mkdirSync(fusionStateDir, { recursive: true });
            fs.writeFileSync(
                path.join(fusionStateDir, '.gitkeep'),
                '# Superpowers-Fusion state directory\n'
            );
            result.created.push(fusionStateDir);
        }

        // 6. Copy .env.example if not exists
        const envExampleSrc = path.join(fusionRoot, '.env.example');
        const envExampleDest = path.join(projectDir, '.env.example');

        if (fs.existsSync(envExampleSrc) && !fs.existsSync(envExampleDest)) {
            fs.copyFileSync(envExampleSrc, envExampleDest);
            result.created.push(envExampleDest);
        }

    } catch (error) {
        result.success = false;
        result.errors.push(String(error));
    }

    return result;
}

/**
 * Generate the TDD edit hook content
 */
function generateEditHook(): string {
    return `/**
 * Superpowers-Fusion TDD Edit Hook
 *
 * This hook enforces TDD based on risk tier configuration.
 * It runs before code edits to verify tests exist.
 */

export default {
  name: 'superpowers-fusion-tdd',

  // Hook into file edits
  async beforeEdit({ filePath, action }) {
    // Skip non-source files
    if (!isSourceFile(filePath)) {
      return { proceed: true };
    }

    // Check if TDD is enabled
    const config = loadConfig();
    if (!config.tddEnabled) {
      return { proceed: true };
    }

    // Determine risk tier
    const tier = determineRiskTier(filePath, config);

    // For Tier 0, always allow
    if (tier === 0) {
      return { proceed: true };
    }

    // For higher tiers, check for corresponding tests
    const hasTests = await checkTestsExist(filePath);

    if (!hasTests && tier >= 2) {
      return {
        proceed: false,
        message: \`TDD Required: No tests found for \${filePath}. Risk tier: \${tier}\`
      };
    }

    return { proceed: true, tier };
  }
};

function isSourceFile(path) {
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
  return sourceExts.some(ext => path.endsWith(ext));
}

function loadConfig() {
  // Load from .env or default
  return {
    tddEnabled: process.env.TDD_VALIDATION_ENABLED !== 'false',
    defaultTier: parseInt(process.env.TDD_DEFAULT_TIER || '1')
  };
}

function determineRiskTier(filePath, config) {
  // Tier 0: Config, docs, tests
  if (/\\.(md|json|ya?ml|config\\.\\w+)$/.test(filePath)) return 0;
  if (/\\.(test|spec)\\.(ts|tsx|js|jsx)$/.test(filePath)) return 0;

  // Tier 3: Critical paths
  if (/auth|security|payment|crypto/i.test(filePath)) return 3;

  // Default tier
  return config.defaultTier;
}

async function checkTestsExist(filePath) {
  const testPatterns = [
    filePath.replace(/\\.(ts|tsx|js|jsx)$/, '.test.$1'),
    filePath.replace(/\\.(ts|tsx|js|jsx)$/, '.spec.$1'),
    filePath.replace(/src\\//, '__tests__/')
  ];

  const fs = await import('fs');
  return testPatterns.some(p => fs.existsSync(p));
}
`;
}

/**
 * Generate CLAUDE.md section for superpowers-fusion
 */
function generateClaudeMdSection(): string {
    return `## Superpowers-Fusion

<EXTREMELY_IMPORTANT>
You have superpowers-fusion installed. This provides:
- TDD enforcement hooks (see .claude/hooks/edit.js)
- Structured change management (see /new-change, /archive commands)
- Skills for development workflows (see .claude/skills/)

Before ANY task, check if a skill applies. If it does, you MUST use it.
</EXTREMELY_IMPORTANT>

### Key Commands

- \`/new-change <name>\` - Start a new tracked change
- \`/archive <name>\` - Archive completed change
- \`/brainstorm\` - Explore requirements before implementation
- \`/execute-plan\` - Execute plan in batches

### ENV Configuration

See \`.env.example\` for TDD and API configuration options.
`;
}

/**
 * Recursively copy a directory
 */
function copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'init') {
        const options: InitOptions = {
            force: args.includes('--force'),
            skipHooks: args.includes('--skip-hooks'),
            skipSkills: args.includes('--skip-skills')
        };

        init(process.cwd(), options).then(result => {
            console.log('Superpowers-Fusion Initialization');
            console.log('================================');
            console.log('');

            if (result.created.length > 0) {
                console.log('Created:');
                result.created.forEach(f => console.log(`  ✓ ${f}`));
            }

            if (result.skipped.length > 0) {
                console.log('Skipped (already exist):');
                result.skipped.forEach(f => console.log(`  - ${f}`));
            }

            if (result.errors.length > 0) {
                console.log('Errors:');
                result.errors.forEach(e => console.log(`  ✗ ${e}`));
                process.exit(1);
            }

            console.log('');
            console.log('Done! See CLAUDE.md for usage instructions.');
        });
    } else {
        console.log('Superpowers-Fusion CLI');
        console.log('');
        console.log('Usage:');
        console.log('  superpowers-fusion init [options]');
        console.log('');
        console.log('Options:');
        console.log('  --force        Overwrite existing files');
        console.log('  --skip-hooks   Skip TDD hook installation');
        console.log('  --skip-skills  Skip skills copying');
    }
}
