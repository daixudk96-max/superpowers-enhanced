# Superpowers Fusion (Enhanced)

> **Unified AI Coding Assistant System**
>
> Fusing **Superpowers** (Core Skills), **TDD-Guard** (Risk-Tier Safety), **OpenSpec** (Change Management), **Conductor** (Context Awareness), and **CodexMCP** (Dual-Agent Collaboration).

This repository contains the `superpowers-fusion` plugin implementation, designed to enhance Claude Code/Cursor/Windsurf workflows with agentic capabilities.

## Key Features

- **🛡️ TDD Enforcement**: Risk-tier based validation (Tier 0-3) preventing unsafe edits without tests.
- **🧠 Skills Library**: 6 core agentic skills (Brainstorming, Planning, Execution, Subagent, TDD, Verification).
- **📋 Change Management**: `/new-change` -> `/archive` workflow with `metadata.json` tracking and Git SHA snapshots.
- **⏮️ Granular Revert**: Three-level undo capability (Change / Phase / Task).
- **🤖 CodexMCP Integration**: Dual-agent sessions (Architect + Builder) with session persistence.
- **🌐 Multi-Provider API**: Support for Anthropic, OpenRouter, Google Gemini, and OpenAI-compatible endpoints.

## Installation

```bash
# 1. Clone/copy to your project
cp -r superpowers-fusion .claude/

# 2. Install dependencies
cd .claude/superpowers-fusion && npm install

# 3. Build
npm run build

# 4. Configure (optional)
cp .env.example .env

# 5. Install CodexMCP
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp
```

## Quick Start

```bash
# Initialize context
/setup

# Create a new change
/new-change my-feature

# Archive completed change
/archive my-feature

# Revert if needed
/revert change my-feature
```

## Project Structure

```
superpowers-fusion/
├── skills/           # 6 Skills (brainstorming, writing-plans, etc.)
├── hooks/            # TDD enforcement hooks
├── lib/              # Core modules (config, risk, language, AST...)
├── commands/         # Slash command handlers
├── context/          # Project context templates
├── changes/          # Change tracking
└── .fusion/          # Runtime state (gitignored)
```

## Configuration

See `.env.example` for all configuration options including:
- TDD validation settings
- Multi-provider API support (Anthropic, OpenRouter, Google, OpenAI)
- AST quality checks

## License

MIT
