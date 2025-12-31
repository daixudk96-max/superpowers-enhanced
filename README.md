# Superpowers Fusion

> Unified Claude Code plugin fusing **Superpowers**, **TDD-Guard**, **OpenSpec**, **Conductor**, and **CodexMCP**

## Features

- **Skills** (Superpowers): Reusable templates for brainstorming, planning, execution
- **TDD Enforcement** (TDD-Guard): Risk-tier based test-first development
- **Change Management** (OpenSpec): Proposal → Implement → Archive workflow
- **Context Management** (Conductor): Persistent project context
- **AI Collaboration** (CodexMCP): Claude Code + Codex dual-agent workflow

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
