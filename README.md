# Superpowers Fusion

> **Unified Claude Code Plugin**
>
> Fusing **Superpowers** (Core Skills), **TDD-Guard** (Risk-Tier Safety), **OpenSpec** (Change Management), and **CodexMCP** (Dual-Agent Collaboration).

A pure Markdown-based plugin for Claude Code that enhances AI-driven development workflows with structured skills, commands, and collaborative patterns.

## Features

- **Skills Library**: 7 core agentic skills for systematic development
- **TDD Enforcement**: Risk-tier based validation (Tier 0-3) preventing unsafe edits
- **Change Management**: `/new-change` → `/archive` workflow with Git SHA tracking
- **Granular Revert**: Three-level undo (Change / Phase / Task)
- **CodexMCP Integration**: Dual-agent collaboration with prototype-review cycles

## Installation

### Option 1: Plugin Marketplace (Recommended)

```bash
# 1. Register the marketplace
/plugin marketplace add <your-github-username>/superpowers-fusion-marketplace

# 2. Install the plugin
/plugin install superpowers-fusion@superpowers-fusion-marketplace

# 3. Verify installation
/help
# You should see /setup, /new-change, /archive, /revert commands
```

### Option 2: Manual Installation

```bash
# 1. Clone to your global Claude directory
git clone https://github.com/<your-username>/superpowers-fusion.git ~/.claude/plugins/superpowers-fusion

# 2. Copy skills to global skills directory
cp -r ~/.claude/plugins/superpowers-fusion/skills/* ~/.claude/skills/

# 3. Copy commands to global commands directory
cp ~/.claude/plugins/superpowers-fusion/commands/*.md ~/.claude/commands/
```

### Option 3: Project-Level Installation

```bash
# Copy to your project's .claude directory
cp -r superpowers-fusion/.claude-plugin .claude/
cp -r superpowers-fusion/skills .claude/
cp -r superpowers-fusion/commands .claude/
```

## Project Structure

```
superpowers-fusion/
├── .claude-plugin/           # Plugin manifest
│   ├── plugin.json           # Plugin metadata
│   └── marketplace.json      # Marketplace configuration
├── skills/                   # 7 Core Skills
│   ├── brainstorming/        # Solution ideation
│   ├── writing-plans/        # Task breakdown
│   ├── executing-plans/      # Implementation with tracking
│   ├── subagent-driven-development/  # Codex delegation
│   ├── codex-collaboration/  # Dual-agent workflow (NEW)
│   ├── test-driven-development/      # TDD with Risk Tiers
│   └── verification-before-completion/
├── commands/                 # Slash Commands
│   ├── setup.md              # /setup - Initialize context
│   ├── new-change.md         # /new-change - Create change
│   ├── archive.md            # /archive - Archive change
│   └── revert.md             # /revert - Granular revert
├── context/                  # Project context templates
│   ├── product.md
│   ├── tech-stack.md
│   └── workflow.md
└── changes/                  # Change tracking directory
    └── archive/              # Archived changes
```

## Quick Start

```bash
# 1. Initialize project context
/setup

# 2. Create a new change
/new-change add-user-auth

# 3. Work through tasks with TDD
# (Skills activate automatically)

# 4. Archive when complete
/archive add-user-auth

# 5. Revert if needed
/revert change add-user-auth
```

## Skills Overview

| Skill | Purpose | Auto-Trigger |
|-------|---------|--------------|
| **brainstorming** | Generate solution options | Ambiguous requests |
| **writing-plans** | Break work into 2-5 min tasks | Before implementation |
| **executing-plans** | Implement with Git tracking | During task execution |
| **subagent-driven-development** | Delegate to Codex | Complex implementations |
| **codex-collaboration** | Dual-agent review cycle | All coding tasks |
| **test-driven-development** | Risk-tier TDD enforcement | Before code edits |
| **verification-before-completion** | Final quality checks | Before marking complete |

## Risk Tiers (TDD)

| Tier | Files | Requirement |
|------|-------|-------------|
| 0 | `*.md`, LICENSE | None |
| 1 | `*.json`, `*.css` | Logged |
| 2 | General code | Test OR exemption |
| 3 | `/api/`, `/auth/`, `/core/` | Strict test-first |

## CodexMCP Integration

This plugin is designed to work with [CodexMCP](https://github.com/GuDaStudio/codexmcp):

```bash
# Install CodexMCP
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp

# Verify
claude mcp list
```

The **codex-collaboration** skill provides structured prompts for:
1. Analysis handoff
2. Prototype requests (unified diff only)
3. Implementation review
4. Constructive debate

## Commands Reference

| Command | Description |
|---------|-------------|
| `/setup` | Initialize `context/`, `changes/`, `.fusion/` |
| `/new-change <name>` | Create change with proposal and tasks |
| `/archive <name> [--yes] [--tag]` | Archive with metadata.json |
| `/revert [change\|phase\|task] <id>` | Granular revert using Git SHA |

## License

MIT
