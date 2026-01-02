# superpowers-fusion

> Unified Claude Code plugin fusing Superpowers, TDD-Guard, OpenSpec, Conductor, and CodexMCP

## Quick Start

```bash
# Prerequisites
Node.js 18+ and npm

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys

# Install CodexMCP
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp

# Verify
claude mcp list
```

## Project Structure

```
superpowers-fusion/
├── skills/           # Skill implementations (brainstorming, writing-plans, etc.)
├── hooks/            # Lifecycle hooks (preToolEdit, postToolEdit, etc.)
├── context/          # Context providers (product.md, tech-stack.md, workflow.md)
├── changes/          # OpenSpec change tracking
├── lib/              # Shared utilities
├── commands/         # Slash command handlers (/setup, /archive, /revert)
├── .fusion/          # Runtime state (gitignored)
└── .env.example      # Configuration template
```

## Features

- **Skills** (from Superpowers): Reusable skill templates for brainstorming, planning, execution
- **TDD Enforcement** (from TDD-Guard): Risk-tier based test-first development
- **Change Management** (from OpenSpec): Proposal → Implement → Archive workflow
- **Context Management** (from Conductor): Persistent project context
- **AI Collaboration** (via CodexMCP): Claude Code + Codex dual-agent workflow

---

## CodexMCP 协作规范

### Core Instructions

在任何时刻，你必须思考当前过程可以如何与 Codex 进行协作:

1. **需求分析后**: 将需求和初始思路告知 Codex，要求其完善需求分析和实施计划
2. **编码任务前**: 向 Codex 索要代码原型 (仅 unified diff patch，禁止实际修改)
3. **编码完成后**: 立即使用 Codex review 代码改动
4. **独立思考**: Codex 仅提供参考，你必须有自己的判断，甚至可以质疑 Codex

### Tool Invocation

**Parameters**:
- `PROMPT` (required): Task instruction for Codex
- `cd` (required): Working directory path
- `sandbox`: `"read-only"` (recommended), `"workspace-write"`, or `"danger-full-access"`
- `SESSION_ID`: Pass to continue previous conversation

**Session Management**:
- Always save returned `SESSION_ID` for follow-up calls
- Use same session for related tasks within a Change
- Clear expired sessions when archiving

### Example Usage

**Start new session:**
```typescript
mcp_codex_codex({
  PROMPT: "分析用户登录功能的安全需求...",
  cd: "/path/to/project",
  sandbox: "read-only"
})
// Returns: { success: true, SESSION_ID: "uuid-string", agent_messages: "..." }
```

**Continue session:**
```typescript
mcp_codex_codex({
  PROMPT: "基于上述分析，生成认证模块的代码原型",
  cd: "/path/to/project",
  sandbox: "read-only",
  SESSION_ID: "previous-session-id"
})
```

---

## TDD Configuration

Configure TDD validation in `.env`:

```bash
# Validation client: 'api' or 'sdk'
TDD_VALIDATION_CLIENT=sdk

# API Provider: 'anthropic', 'openrouter', 'google', 'openai-compatible'
TDD_API_PROVIDER=anthropic

# See .env.example for full configuration options
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | Initialize context/ directory with templates |
| `/new-change <name>` | Create new change in changes/ |
| `/archive <name>` | Archive completed change with metadata.json |
| `/revert [change\|phase\|task] <id>` | Revert to previous state |

---

## Runtime State

The `.fusion/` directory stores:
- `status.json`: Task completion status with Git SHA
- `codex-sessions.json`: Persistent Codex session IDs

**Note**: Add `.fusion/` to `.gitignore` for ephemeral data, or commit for team sharing.

## Superpowers-Fusion
Use /setup, /new-change, /archive, /revert to manage your workflow.
TDD is strictly enforced via hooks.
