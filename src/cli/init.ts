import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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
    updated: string[];
    errors: string[];
}

export async function initCommand(args: string[]): Promise<void> {
    const options: InitOptions = {
        force: args.includes('--force'),
        skipHooks: args.includes('--skip-hooks'),
        skipSkills: args.includes('--skip-skills')
    };

    const result: InitResult = {
        success: true,
        created: [],
        skipped: [],
        updated: [],
        errors: []
    };

    const projectDir = process.cwd();
    // Resolve root from dist/src/cli to root
    const fusionRoot = path.resolve(__dirname, '../../..');
    const claudeGlobalDir = path.join(os.homedir(), '.claude');
    const claudeSettingsPath = path.join(claudeGlobalDir, 'settings.json');

    try {
        // 1. Install hooks via settings.json
        if (!options.skipHooks) {
            if (!fs.existsSync(claudeGlobalDir)) {
                fs.mkdirSync(claudeGlobalDir, { recursive: true });
            }

            let settings: any = {};
            if (fs.existsSync(claudeSettingsPath)) {
                try {
                    settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
                } catch {
                    console.warn('Warning: Could not parse existing settings.json, starting fresh.');
                }
            }

            // Ensure hooks structure
            settings.hooks = settings.hooks || {};
            settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];

            // 1a. Register PreToolUse (TDD Hook)
            const existingTddHookIndex = settings.hooks.PreToolUse.findIndex((h: any) =>
                h.hooks && h.hooks.some((hook: any) => hook.command && hook.command.includes('superpowers-fusion verify-tdd'))
            );

            const tddHookConfig = {
                matcher: "Edit|Write",
                hooks: [
                    {
                        type: "command",
                        command: "superpowers-fusion verify-tdd"
                    }
                ]
            };

            if (existingTddHookIndex === -1) {
                settings.hooks.PreToolUse.push(tddHookConfig);
                result.updated.push('~/.claude/settings.json (TDD hooks added)');
            } else {
                result.skipped.push('~/.claude/settings.json (TDD Hooks already configured)');
            }

            // 1b. Register SessionStart Hook (Task 4.2)
            settings.hooks.SessionStart = settings.hooks.SessionStart || [];
            const existingSessionHookIndex = settings.hooks.SessionStart.findIndex((h: any) =>
                h.command && h.command.includes('session-start.sh')
            );

            if (existingSessionHookIndex === -1) {
                // Determine absolute path to hook script
                // In production, it will be in dist/src/hooks, but for now we look in fusionRoot
                const hookPath = path.join(fusionRoot, 'hooks', 'session-start.sh');

                // On Windows, use 'bash' to run the script if it's .sh
                const cmd = process.platform === 'win32' ? `bash "${hookPath}"` : `"${hookPath}"`;

                settings.hooks.SessionStart.push({
                    type: "command",
                    command: cmd
                });
                result.updated.push('~/.claude/settings.json (SessionStart hook added)');
            } else {
                result.skipped.push('~/.claude/settings.json (SessionStart Hook already configured)');
            }

            fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2));
        }

        // 2. Create .fusion directory
        const fusionStateDir = path.join(projectDir, '.fusion');
        if (!fs.existsSync(fusionStateDir)) {
            fs.mkdirSync(fusionStateDir, { recursive: true });
            fs.writeFileSync(
                path.join(fusionStateDir, '.gitkeep'),
                '# Superpowers-Fusion state directory\n'
            );
            result.created.push('.fusion/ directory');
        }

        // 3. Setup CLAUDE.md
        const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
        const fusionSection = `
## Superpowers-Fusion
Use /setup, /new-change, /archive, /revert to manage your workflow.
TDD is strictly enforced via hooks.
`;
        if (fs.existsSync(claudeMdPath)) {
            const content = fs.readFileSync(claudeMdPath, 'utf8');
            if (!content.includes('Superpowers-Fusion')) {
                fs.appendFileSync(claudeMdPath, fusionSection);
                result.updated.push('CLAUDE.md');
            }
        } else {
            fs.writeFileSync(claudeMdPath, fusionSection);
            result.created.push('CLAUDE.md');
        }

        // 4. Setup .env.example
        const envExampleSrc = path.join(fusionRoot, '.env.example');
        const envExampleDest = path.join(projectDir, '.env.example');
        if (fs.existsSync(envExampleSrc) && !fs.existsSync(envExampleDest)) {
            fs.copyFileSync(envExampleSrc, envExampleDest);
            result.created.push('.env.example');
        }

        // 5. Setup .env with TDD defaults (Task 4.1)
        const envPath = path.join(projectDir, '.env');
        const tddDefaults: Record<string, string> = {
            'TDD_VALIDATION_ENABLED': 'true',
            'TDD_VALIDATION_CLIENT': 'sdk',
            'TDD_AST_CHECKS_ENABLED': 'true',
            'TDD_DEFAULT_TIER': '2',
            'TDD_REJECT_EMPTY_TESTS': 'true',
            'TDD_REJECT_MISSING_ASSERTIONS': 'true',
            'TDD_REJECT_TRIVIAL_ASSERTIONS': 'true',
        };

        let envContent = '';
        let envUpdated = false;

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Add missing TDD config entries
        for (const [key, value] of Object.entries(tddDefaults)) {
            if (!envContent.includes(`${key}=`)) {
                envContent += `${key}=${value}\n`;
                envUpdated = true;
            }
        }

        if (envUpdated) {
            fs.writeFileSync(envPath, envContent);
            result.updated.push('.env (TDD defaults added)');
        } else if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, Object.entries(tddDefaults).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
            result.created.push('.env');
        }

    } catch (error) {
        result.success = false;
        result.errors.push(String(error));
    }

    printResult(result);
}

function printResult(result: InitResult) {
    console.log('Superpowers-Fusion Initialization');
    console.log('================================');
    if (result.updated.length > 0) result.updated.forEach(f => console.log(`  ✓ Updated: ${f}`));
    if (result.created.length > 0) result.created.forEach(f => console.log(`  ✓ Created: ${f}`));
    if (result.skipped.length > 0) result.skipped.forEach(f => console.log(`  - Skipped: ${f}`));
    if (result.errors.length > 0) result.errors.forEach(e => console.log(`  ✗ Error: ${e}`));
    console.log('\nDone!');
}
