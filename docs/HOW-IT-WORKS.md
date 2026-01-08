# Superpowers-Fusion 工作原理

本文档详细说明 `superpowers-fusion` 项目如何与 Claude Code 协同工作。

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code CLI                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Skills    │  │   Hooks     │  │       Commands          │  │
│  │  (技能模板) │  │  (生命周期) │  │      (斜杠命令)         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│         └────────────────┼─────────────────────┘                │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CLAUDE.md (项目指令)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        MCP Servers                              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Codex     │  │  Context7   │                               │
│  │ (AI协作)    │  │ (上下文增强)│                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心组件

### 2.1 MCP Servers (模型上下文协议服务器)

当前已安装的 MCP：

| MCP Server | 用途 | 状态 |
|------------|------|------|
| **codex** | AI 辅助编码、代码原型生成、代码审查 | ✓ Connected |
| **context7** | 上下文增强、文档检索 | ✓ Connected |

#### Codex 协作规范

根据 `CLAUDE.md` 中的指令，Claude Code 与 Codex 的协作遵循以下流程：

1. **需求分析后** → 将需求和初始思路告知 Codex，要求其完善
2. **编码任务前** → 向 Codex 索要代码原型（仅 unified diff patch）
3. **编码完成后** → 使用 Codex review 代码改动
4. **独立思考** → Codex 仅提供参考，Claude 必须有自己的判断

调用示例：
```typescript
mcp_codex_codex({
  PROMPT: "分析用户登录功能的安全需求...",
  cd: "/path/to/project",
  sandbox: "read-only"  // 禁止实际修改代码
})
```

---

### 2.2 Skills (技能模板)

位于 `skills/` 目录，提供可复用的工作流模板：

| Skill | 用途 |
|-------|------|
| `brainstorming/` | 头脑风暴、需求探索 |
| `writing-plans/` | 编写实施计划 |
| `executing-plans/` | 执行计划任务 |
| `test-driven-development/` | TDD 测试驱动开发 |
| `systematic-debugging/` | 系统性调试 |
| `creating-changes/` | 创建变更提案 |
| `archiving-changes/` | 归档已完成的变更 |
| `verification-before-completion/` | 完成前验证 |
| `receiving-code-review/` | 接收代码审查 |
| `requesting-code-review/` | 请求代码审查 |
| `subagent-driven-development/` | 子代理驱动开发 |
| `dispatching-parallel-agents/` | 并行代理调度 |
| `using-git-worktrees/` | Git Worktree 管理 |
| `finishing-a-development-branch/` | 完成开发分支 |
| `writing-skills/` | 编写新技能 |
| `using-superpowers/` | 使用超能力指南 |

---

### 2.3 Hooks (生命周期钩子)

位于 `hooks/` 目录，在特定事件时自动触发：

| Hook | 触发时机 | 功能 |
|------|----------|------|
| `preToolEdit.ts` | 代码编辑前 | TDD 强制检查：确保先有失败的测试 |
| `postToolEdit.ts` | 代码编辑后 | 运行测试、Lint 检查 |
| `sessionHandler.ts` | 会话开始/结束 | 初始化/清理会话状态 |
| `userPromptHandler.ts` | 用户输入时 | 处理特殊命令（如 `tdd on/off`） |
| `session-start.sh` | 会话启动 | Shell 环境初始化 |

#### TDD 强制执行

TDD Guard 根据工作流阶段自动调整严格程度：

| 阶段 | TDD 级别 | 是否阻断 |
|------|----------|----------|
| `brainstorming` | 禁用 | 否 |
| `writing-plans` | 禁用 | 否 |
| `implement` | 强制执行 | 是 (Tier 2+) |
| `executing-plans` | 强制执行 | 是 (Tier 2+) |
| `verification` | 仅检查 | 否 |

---

### 2.4 Commands (斜杠命令)

位于 `commands/` 目录，提供工作流快捷入口：

| 命令 | 功能 |
|------|------|
| `/setup` | 初始化项目上下文，检测技术栈 |
| `/new-change <name>` | 创建新的变更提案 |
| `/status` | 显示当前状态：活动变更、任务进度、阻塞项 |
| `/implement [change]` | 选择变更并循环执行任务直到完成 |
| `/archive <name>` | 归档已完成的变更，生成 metadata.json |
| `/revert [change\|phase\|task] <id>` | 回滚到之前的状态 |
| `/brainstorm` | 启动头脑风暴 |
| `/write-plan` | 编写实施计划 |

---

### 2.5 Runtime State (运行时状态)

位于 `.fusion/` 目录（已加入 .gitignore）：

```
.fusion/
├── reporters/          # 测试报告器 (Vitest/Jest/Pytest)
├── test-results.json   # 最近测试结果
├── status.json         # 任务完成状态 + Git SHA
└── codex-sessions.json # Codex 会话 ID 持久化
```

---

## 3. 工作流程

### 3.1 典型开发流程

```
1. /new-change feature-login
   └── 创建 changes/feature-login/ 目录

2. /brainstorm
   └── 使用 brainstorming skill 探索需求
   └── 调用 Codex 完善需求分析

3. /write-plan
   └── 使用 writing-plans skill 编写计划
   └── 生成 tasks.md 任务清单

4. /implement feature-login
   └── 进入 executing-plans skill
   └── TDD Guard 激活
   └── 每次编辑前后触发 Hooks
   └── Codex 提供代码原型 → Claude 重写为生产级代码
   └── Codex Review 每次改动

5. /status
   └── 查看进度、阻塞项

6. /archive feature-login
   └── 归档变更到 changes/archive/
   └── 生成 metadata.json
   └── AI 建议更新 context/ 文档
```

### 3.2 Codex 协作时序

```
User Request
     │
     ▼
┌─────────────────┐
│  Claude 初步分析 │
└────────┬────────┘
         │ 1. 告知需求和思路
         ▼
┌─────────────────┐
│  Codex 完善计划  │
└────────┬────────┘
         │ 2. 索要代码原型 (diff patch)
         ▼
┌─────────────────┐
│  Codex 返回原型  │
└────────┬────────┘
         │ 3. Claude 重写为生产级代码
         ▼
┌─────────────────┐
│  Claude 实施编辑 │
└────────┬────────┘
         │ 4. Codex Review 改动
         ▼
┌─────────────────┐
│  Codex 反馈意见  │
└────────┬────────┘
         │ 5. 修正或确认完成
         ▼
      Done
```

---

## 4. 配置说明

### 4.1 环境变量 (.env)

```bash
# TDD 配置
TDD_VALIDATION_CLIENT=sdk          # 验证客户端: 'api' 或 'sdk'
TDD_API_PROVIDER=anthropic         # API 提供商
TDD_LINTER_TYPE=eslint             # Linter 类型
TDD_LINT_ON_GREEN=true             # 测试通过后运行 Lint
TDD_IGNORE_PATTERNS=*.md,*.json    # 忽略的文件模式

# Codex 配置
# (通过 claude mcp add 命令配置，无需环境变量)
```

### 4.2 claude-plugin.json

```json
{
  "schema_version": "v1",
  "name": "superpowers-fusion",
  "entry_points": {
    "skills": "./skills",
    "hooks": "./dist/hooks/index.js",
    "commands": "./commands"
  },
  "hooks": {
    "preToolEdit": "./dist/hooks/preToolEdit.js",
    "postToolEdit": "./dist/hooks/postToolEdit.js",
    "sessionHandler": "./dist/hooks/sessionHandler.js"
  },
  "dependencies": {
    "codex-mcp": "required"
  }
}
```

---

## 5. 与 Claude CodePro 的区别

| 特性 | superpowers-fusion | claude-codepro |
|------|-------------------|----------------|
| **核心理念** | Codex 双代理协作 | 完整开发环境 |
| **运行环境** | 本地 Windows/Mac/Linux | Docker Dev Container |
| **MCP 依赖** | codex (必需) | claude-context, tavily, ref, claude-mem |
| **TDD 实现** | 内置 Hooks | 内置 Hooks |
| **技能系统** | 来自 Superpowers | 来自 Superpowers (致敬) |
| **Lazy Loading** | 无 | 有 |
| **持久记忆** | 通过 Codex Session | 通过 Claude Mem |

---

## 6. 常见问题

### Q: 如何检查 MCP 是否正常工作？
```bash
claude mcp list
```

### Q: 如何临时关闭 TDD 强制执行？
在对话中输入：
```
tdd off
```

### Q: 如何添加新的 MCP？
```bash
claude mcp add <name> -- <command>
```

### Q: Codex 会话如何持久化？
会话 ID 存储在 `.fusion/codex-sessions.json`，同一变更内的多次调用会复用会话。

---

## 7. 标准运行流程

### 7.1 启动阶段

当您在项目目录中启动 Claude Code 时，以下步骤自动执行：

```
打开项目目录 (superpowers-fusion/)
     │
     ▼
Claude Code 自动加载 CLAUDE.md
     │  └── 包含 Codex 协作规范、TDD 配置等
     │
     ▼
SessionStart Hook 触发 (session-start.js)
     │  └── 注入 using-superpowers skill 到上下文
     │  └── 检查遗留目录并发出警告
     │
     ▼
MCP Servers 自动连接
     │  └── codex: ✓ Connected
     │  └── context7: ✓ Connected
     │
     ▼
就绪，等待用户输入
```

**注意**：SessionStart Hook 注入的上下文对用户不可见，但 Claude 会遵循其中的指令。

### 7.2 完整开发流程（新功能/大改动）

```bash
# Step 1: 检查当前状态
/status

# Step 2: 创建变更提案
/new-change <feature-name>
# → 创建 changes/<feature-name>/ 目录

# Step 3: 头脑风暴（需求探索）
/brainstorm
# → Claude 分析需求
# → 调用 Codex 完善需求分析

# Step 4: 编写实施计划
/write-plan
# → 生成 tasks.md 任务清单

# Step 5: 实施开发（核心阶段）
/implement
# → TDD Guard 激活
# → 每次编辑触发 preToolEdit / postToolEdit
# → Codex 提供代码原型 → Claude 重写 → Codex Review

# Step 6: 归档完成
/archive <feature-name>
# → 归档到 changes/archive/
# → 生成 metadata.json
# → AI 建议更新 context/ 文档
```

### 7.3 简化流程（小任务/修复）

对于简单的 Bug 修复或小改动，可以跳过完整流程：

```bash
# 直接描述任务
"请修复 xxx 模块的空指针异常"

# Claude 自动执行:
# 1. 分析问题 → 告知 Codex
# 2. 获取 Codex 代码原型 (unified diff)
# 3. 重写为生产级代码
# 4. 实施修改（触发 TDD Hooks）
# 5. Codex Review 改动
```

### 7.4 关键检查点

| 时机 | 检查命令 | 用途 |
|------|----------|------|
| 开始工作前 | `claude mcp list` | 确认 MCP 连接正常 |
| 工作中 | `/status` | 查看进度和阻塞项 |
| 遇到 TDD 问题 | `tdd status` | 检查 TDD 状态 |
| 临时跳过 TDD | `tdd off` | 禁用 TDD 强制执行 |
| 完成后 | `/archive` | 归档并更新文档 |

### 7.5 快速参考卡

```
┌─────────────────────────────────────────────────────────┐
│              Superpowers-Fusion 标准流程                │
├─────────────────────────────────────────────────────────┤
│  新功能:  /new-change → /brainstorm → /write-plan →   │
│           /implement → /archive                         │
├─────────────────────────────────────────────────────────┤
│  小修复:  直接描述任务，Claude 自动处理                 │
├─────────────────────────────────────────────────────────┤
│  TDD 控制: tdd on | tdd off | tdd status               │
├─────────────────────────────────────────────────────────┤
│  状态检查: /status | claude mcp list                   │
├─────────────────────────────────────────────────────────┤
│  Codex 协作: 分析→原型→重写→Review (自动执行)          │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 参考资料

- [Superpowers 原项目](https://github.com/obra/superpowers)
- [CodexMCP](https://github.com/GuDaStudio/codexmcp)
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
