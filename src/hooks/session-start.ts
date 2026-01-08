#!/usr/bin/env node
/**
 * SessionStart hook for superpowers-fusion plugin
 * 
 * This script outputs JSON context to be injected into Claude Code sessions.
 * It reads the using-superpowers skill and checks for legacy skill directories.
 * 
 * @migration Migrated from hooks/session-start.sh to resolve Windows path issues
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Determine plugin root directory (from dist/src/hooks back to project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, '..', '..', '..');

// Read using-superpowers skill content
const skillPath = path.join(pluginRoot, 'skills', 'using-superpowers', 'SKILL.md');
let skillContent: string;

try {
    skillContent = fs.readFileSync(skillPath, 'utf8');
} catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`Error reading using-superpowers skill: ${detail}`);
    process.exit(1);
}

// Check for legacy skills directory and build warning message
const legacyDir = path.join(os.homedir(), '.config', 'superpowers', 'skills');
const warningMessage = fs.existsSync(legacyDir)
    ? '\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers-Fusion now uses Claude Code\'s skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>'
    : '';

// Build output object (JSON.stringify handles all escaping automatically)
const output = {
    hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<EXTREMELY_IMPORTANT>\nYou have superpowers-fusion.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${skillContent}\n\n${warningMessage}\n</EXTREMELY_IMPORTANT>`,
    },
};

console.log(JSON.stringify(output, null, 2));
