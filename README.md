# Superpowers Fusion

> **Unified AI Coding Assistant System**
>
> Fusing **Superpowers** (Core Skills), **TDD-Guard** (Risk-Tier Safety), **OpenSpec** (Change Management), and **CodexMCP** (Dual-Agent Collaboration).

A robust plugin ecosystem for Claude Code that enforces test-driven development and structured workflows.

## Features

- **🛡️ TDD Enforcement**: Hooks that block edits to core code without tests (Tier 2/3).
- **🧠 Skills Library**: 7 core agentic skills (Brainstorming, Planning, Execution, Subagent, TDD, Verification).
- **📋 Change Management**: `/new-change` → `/archive` workflow with metadata tracking.
- **⏮️ Granular Revert**: Three-level undo capability (Change / Phase / Task).
- **🤖 CodexMCP Integration**: Dual-agent collaboration with unified diff prototypes.

## Installation

### 1. Install CLI Tool

Install the package globally to enable the TDD hooks and CLI commands.

```bash
npm install -g superpowers-fusion
```

### 2. Initialize in Project

Run this command in **every project** where you want to enable Superpowers Fusion.

```bash
superpowers-fusion init
```

This will:
- Configure Claude Code hooks in `~/.claude/settings.json` (if not present)
- Create a `.fusion/` directory for local state
- Create `CLAUDE.md` with usage instructions
- Copy `.env.example` to `.env`

### 3. Install CodexMCP (Optional but Recommended)

For dual-agent collaboration features:

```bash
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp
```

## How It Works

### TDD Guard (Hooks)

The system automatically intercepts `Edit` and `Write` tool calls:

- **Tier 0 Files** (Docs, Configs): Allowed immediately.
- **Tier 2 Files** (General Code): **BLOCKED** unless a test file exists OR `<!-- TDD-EXEMPT -->` comment is present.
- **Tier 3 Files** (Core Logic): **BLOCKED** unless a test file exists (No exemptions).

### Skills & Commands

The initialization process installs global Markdown-based skills and commands for Claude:

- `/setup` - Initialize project context
- `/new-change <name>` - Start a structured change
- `/archive <name>` - Archive a completed change
- `/revert` - undo changes with precision

## Configuration

Edit `.env` to configure TDD behavior:

```bash
# Enable/Disable TDD validation
TDD_VALIDATION_ENABLED=true

# Default Risk Tier (1=Log, 2=Warn/Block, 3=Strict)
TDD_DEFAULT_TIER=2
```

## Project Structure

```
superpowers-fusion/
├── src/cli/            # CLI implementation (init, verify-tdd)
├── skills/             # Markdown skill templates
├── commands/           # Markdown command templates
├── context/            # Project context templates
└── dist/               # Compiled JS code
```

## License

MIT
