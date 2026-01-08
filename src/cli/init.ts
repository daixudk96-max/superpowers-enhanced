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
    tier?: 1 | 2 | 3;
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
        skipSkills: args.includes('--skip-skills'),
        tier: parseTier(args),
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

            // IMPORTANT: Claude Code does NOT load hooks from hooks/hooks.json via plugin system.
            // Hooks MUST be configured directly in .claude/settings.local.json (project-level)
            // or ~/.claude/settings.json (global). We install to project-level settings.local.json.

            // Clean up any legacy hooks that were written by previous versions
            if (settings.hooks.SessionStart) {
                const legacyHookIndex = settings.hooks.SessionStart.findIndex((h: any) =>
                    h.hooks && h.hooks.some((hook: any) =>
                        hook.command && (
                            hook.command.includes('session-start.sh') ||
                            hook.command.includes('session-start.js')
                        )
                    )
                );
                if (legacyHookIndex !== -1) {
                    settings.hooks.SessionStart.splice(legacyHookIndex, 1);
                    if (settings.hooks.SessionStart.length === 0) {
                        delete settings.hooks.SessionStart;
                    }
                    result.updated.push('~/.claude/settings.json (legacy SessionStart hook removed)');
                }
            }

            // Clean up legacy PreToolUse hooks (now handled by plugin)
            if (settings.hooks.PreToolUse) {
                const legacyTddHookIndex = settings.hooks.PreToolUse.findIndex((h: any) =>
                    h.hooks && h.hooks.some((hook: any) =>
                        hook.command && hook.command.includes('superpowers-fusion verify-tdd')
                    )
                );
                if (legacyTddHookIndex !== -1) {
                    settings.hooks.PreToolUse.splice(legacyTddHookIndex, 1);
                    if (settings.hooks.PreToolUse.length === 0) {
                        delete settings.hooks.PreToolUse;
                    }
                    result.updated.push('~/.claude/settings.json (legacy PreToolUse hook removed)');
                }
            }

            // Clean up legacy UserPromptSubmit hooks
            if (settings.hooks.UserPromptSubmit) {
                const legacyPromptHookIndex = settings.hooks.UserPromptSubmit.findIndex((h: any) =>
                    h.hooks && h.hooks.some((hook: any) =>
                        hook.command && hook.command.includes('user-prompt-handler.js')
                    )
                );
                if (legacyPromptHookIndex !== -1) {
                    settings.hooks.UserPromptSubmit.splice(legacyPromptHookIndex, 1);
                    if (settings.hooks.UserPromptSubmit.length === 0) {
                        delete settings.hooks.UserPromptSubmit;
                    }
                    result.updated.push('~/.claude/settings.json (legacy UserPromptSubmit hook removed)');
                }
            }

            // Clean up empty hooks object
            if (Object.keys(settings.hooks).length === 0) {
                delete settings.hooks;
            }

            fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2));

            // Install hooks to project-level .claude/settings.local.json
            // This is the CORRECT way to configure hooks for Claude Code
            const projectClaudeDir = path.join(projectDir, '.claude');
            const projectSettingsPath = path.join(projectClaudeDir, 'settings.local.json');
            
            if (!fs.existsSync(projectClaudeDir)) {
                fs.mkdirSync(projectClaudeDir, { recursive: true });
                result.created.push('.claude/ directory');
            }

            let projectSettings: any = {};
            if (fs.existsSync(projectSettingsPath)) {
                try {
                    projectSettings = JSON.parse(fs.readFileSync(projectSettingsPath, 'utf8'));
                } catch {
                    console.warn('Warning: Could not parse existing .claude/settings.local.json, starting fresh.');
                }
            }

            // Configure TDD hooks in project settings
            // Hooks need to cd to fusionRoot first to load .env and find config files
            // Use forward slashes for cross-platform compatibility (works on Windows bash too)
            const fusionRootNormalized = fusionRoot.replace(/\\/g, '/');
            const quoteIfNeeded = (p: string) => p.includes(' ') ? `"${p}"` : p;
            
            const hooksConfig = {
                PreToolUse: [
                    {
                        matcher: 'Edit|Write|edit|write',
                        hooks: [
                            {
                                type: 'command',
                                command: `cd ${quoteIfNeeded(fusionRootNormalized)} && node dist/src/cli/index.js verify-tdd`
                            }
                        ]
                    }
                ],
                SessionStart: [
                    {
                        matcher: 'startup|resume|clear|compact',
                        hooks: [
                            {
                                type: 'command',
                                command: `cd ${quoteIfNeeded(fusionRootNormalized)} && node dist/src/hooks/session-start.js`
                            }
                        ]
                    }
                ],
                UserPromptSubmit: [
                    {
                        matcher: '.*',
                        hooks: [
                            {
                                type: 'command',
                                command: `cd ${quoteIfNeeded(fusionRootNormalized)} && node dist/src/hooks/user-prompt-handler.js`
                            }
                        ]
                    }
                ]
            };

            // Only update hooks if not already configured or force flag is set
            if (!projectSettings.hooks || options.force) {
                projectSettings.hooks = hooksConfig;
                fs.writeFileSync(projectSettingsPath, JSON.stringify(projectSettings, null, 2));
                result.updated.push('.claude/settings.local.json (TDD hooks installed)');
            } else {
                result.skipped.push('.claude/settings.local.json (hooks already configured, use --force to override)');
            }
        }

        // 2. Create .fusion directory and init TDD state
        const fusionStateDir = path.join(projectDir, '.fusion');
        if (!fs.existsSync(fusionStateDir)) {
            fs.mkdirSync(fusionStateDir, { recursive: true });
            fs.writeFileSync(
                path.join(fusionStateDir, '.gitkeep'),
                '# Superpowers-Fusion state directory\n'
            );
            result.created.push('.fusion/ directory');
        }

        // Initialize TDD guard state if not exists
        const tddStatePath = path.join(fusionStateDir, 'tdd-guard-state.json');
        if (!fs.existsSync(tddStatePath)) {
            const defaultState = {
                enabled: true,
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(tddStatePath, JSON.stringify(defaultState, null, 2));
            result.created.push('.fusion/tdd-guard-state.json (TDD Guard enabled)');
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
            'VALIDATION_CLIENT': 'sdk',
            'TDD_GUARD_MODEL_VERSION': 'claude-sonnet-4-0',
            'TDD_GUARD_ANTHROPIC_API_KEY': '',
            'TDD_AST_CHECKS_ENABLED': 'true',
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

        // 6. Optional: apply tier preset
        if (options.tier) {
            const { setTierPreset } = await import('./tier.js');
            const presetResult = setTierPreset(projectDir, options.tier);
            result.updated.push(`Tier ${options.tier} preset applied (${presetResult.configPath})`);
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

function parseTier(args: string[]): 1 | 2 | 3 | undefined {
    const tierFlag = args.find((arg) => arg.startsWith('--tier'));
    if (!tierFlag) return undefined;

    const value =
        tierFlag === '--tier'
            ? args[args.indexOf('--tier') + 1]
            : tierFlag.split('=')[1];

    const num = Number(value);
    if (num === 1 || num === 2 || num === 3) {
        return num;
    }

    console.warn('忽略无效的 --tier 值，仅支持 1/2/3');
    return undefined;
}
