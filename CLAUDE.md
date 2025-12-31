# superpowers-fusion

> Unified Claude Code plugin fusing Superpowers, TDD-Guard, OpenSpec, and CodexMCP

## Quick Start

### Plugin Installation

```bash
# Option 1: Via marketplace (when published)
/plugin marketplace add <username>/superpowers-fusion-marketplace
/plugin install superpowers-fusion@superpowers-fusion-marketplace

# Option 2: Manual installation
cp -r skills/* ~/.claude/skills/
cp commands/*.md ~/.claude/commands/
```

### CodexMCP Installation

```bash
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp
claude mcp list
```

## Project Structure

```
superpowers-fusion/
├── .claude-plugin/       # Plugin manifest
├── skills/               # 7 Core Skills (Markdown)
│   ├── brainstorming/
│   ├── writing-plans/
│   ├── executing-plans/
│   ├── subagent-driven-development/
│   ├── codex-collaboration/
│   ├── test-driven-development/
│   └── verification-before-completion/
├── commands/             # 4 Slash Commands (Markdown)
│   ├── setup.md
│   ├── new-change.md
│   ├── archive.md
│   └── revert.md
├── context/              # Project context templates
└── changes/              # Change tracking
```

## Features

- **Skills**: Pure Markdown skill templates that Claude follows automatically
- **Commands**: /setup, /new-change, /archive, /revert
- **TDD**: Risk-tier based validation (Tier 0-3) embedded in skills
- **Codex**: Dual-agent collaboration workflow

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
- `sandbox`: `"read-only"` (recommended) - **ALWAYS use read-only**
- `SESSION_ID`: Pass to continue previous conversation

**Session Management**:
- Always save returned `SESSION_ID` for follow-up calls
- Use same session for related tasks within a Change
- Clear expired sessions when archiving

### Example Usage

**Start new session:**
```
mcp__codex__codex({
  PROMPT: "分析用户登录功能的安全需求...",
  cd: "/path/to/project",
  sandbox: "read-only"
})
// Returns: { success: true, SESSION_ID: "uuid-string", agent_messages: "..." }
```

**Continue session:**
```
mcp__codex__codex({
  PROMPT: "基于上述分析，生成认证模块的代码原型",
  cd: "/path/to/project",
  sandbox: "read-only",
  SESSION_ID: "previous-session-id"
})
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

**Note**: Add `.fusion/` to `.gitignore` for ephemeral data.

## License

MIT
