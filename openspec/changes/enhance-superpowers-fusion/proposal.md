# 增强 Superpowers Fusion 提案 (完整版)

## 变更概述

从 obra/superpowers **复制原始文件**，再做符合当前流程的适配修改。

---

## 一、缺失内容清单

### Skills（缺 5 个）

| Skill | 来源 | 操作 |
|-------|------|------|
| using-superpowers | obra/superpowers | 复制 → 适配 |
| using-git-worktrees | obra/superpowers | 复制 → 适配 |
| requesting-code-review | obra/superpowers | 复制 → 适配 Codex 优先 |
| finishing-a-development-branch | obra/superpowers | 复制 → 适配 archive 联动 |
| dispatching-parallel-agents | obra/superpowers | 复制 → 适配 |
| writing-skills | obra/superpowers | 复制 → 保留 |

### 目录（缺 3 个）

| 目录 | 来源 | 内容 |
|------|------|------|
| agents/ | obra/superpowers | code-reviewer.md |
| .codex/ | obra/superpowers | INSTALL.md, superpowers-bootstrap.md, superpowers-codex |
| .opencode/ | obra/superpowers | INSTALL.md, plugin/ |

### Commands（缺 2 个）

| Command | 来源 | 操作 |
|---------|------|------|
| brainstorm.md | obra/superpowers | 复制 → 保留 |
| execute-plan.md | obra/superpowers | 复制 → 保留 |

---

## 二、工作流调整

```
/brainstorm → /new-change(合并write-plan) → /execute-plan → /archive
```

---

## 三、适配修改清单

| 文件 | 适配内容 |
|------|----------|
| requesting-code-review/SKILL.md | 添加 CodexMCP 优先调用 |
| finishing-a-development-branch/SKILL.md | 添加 archive 联动 |
| agents/code-reviewer.md | 调整为 Codex subagent 调用 |
| .codex/INSTALL.md | 更新为 fusion 安装路径 |
| .opencode/INSTALL.md | 更新为 fusion 安装路径 |

---

## 五、TDD 安装说明

### 安装命令

```bash
# 方式 1: npx (推荐)
npx superpowers-fusion init

# 方式 2: 全局安装
npm install -g superpowers-fusion
superpowers-fusion init
```

### 安装后结构

```
your-project/
├── .claude/
│   ├── skills/         # 复制的 Skills
│   ├── commands/       # 复制的 Commands
│   └── hooks/
│       └── edit.js     # TDD 强制 hook
├── .fusion/            # 状态目录
└── CLAUDE.md           # 更新的配置
```

---

## 六、ENV API 配置

更改 API 提供商，编辑项目根目录的 `.env` 文件：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `TDD_VALIDATION_CLIENT` | `sdk` 或 `api` | `sdk` |
| `TDD_API_PROVIDER` | `anthropic` / `openrouter` / `google` / `openai-compatible` | `anthropic` |

### 各提供商 API Key 配置

| 提供商 | Key 变量 | 获取地址 |
|--------|----------|----------|
| Anthropic | `ANTHROPIC_API_KEY` | console.anthropic.com |
| OpenRouter | `OPENROUTER_API_KEY` | openrouter.ai/keys |
| Google | `GOOGLE_API_KEY` | aistudio.google.com/apikey |
| OpenAI | `OPENAI_API_KEY` | platform.openai.com |

详见 `.env.example` 中的完整配置示例。

---

## 七、兼容性

所有修改为**新增（Additive）**，不影响现有 TypeScript 代码：
- hooks/*.ts 保留
- lib/*.ts 保留
- 构建/测试命令保留
