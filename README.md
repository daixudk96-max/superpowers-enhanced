# Superpowers Fusion

> **统一 AI 编码助手系统**
>
> 融合 **Superpowers**（核心技能）、**TDD-Guard**（风险分层安全）、**OpenSpec**（变更管理）和 **CodexMCP**（双 Agent 协作）。

一个强化 Claude Code 的插件生态系统，强制执行测试驱动开发和结构化工作流。

## 功能特性

- **🛡️ TDD 强制执行**：在编辑核心代码时自动拦截，必须有测试（Tier 2/3）。
- **🧠 技能库**：7 个核心 Agent 技能（头脑风暴、规划、执行、子 Agent、TDD、验证）。
- **📋 变更管理**：`/new-change` → `/archive` 工作流，带元数据跟踪。
- **⏮️ 精细撤销**：三级撤销能力（变更级 / 阶段级 / 任务级）。
- **🤖 CodexMCP 集成**：双 Agent 协作与统一 diff 原型。

---

## 安装指南

### 方式 A：标准开发安装（推荐）

按照以下顺序操作，确保插件正确注册并编译。

1. **进入项目目录**

   ```bash
   git clone https://github.com/daixudk96-max/superpowers-fusion.git
   cd superpowers-fusion
   ```
2. **注册 Marketplace**
   将当前目录注册为本地 Marketplace。

   ```bash
   claude plugin marketplace add ./
   # 注意：必须使用 "./" 指向当前根目录
   ```
3. **安装插件**

   ```bash
   claude plugin install superpowers-fusion --scope user
   ```
4. **配置 TDD API (可选)**
   如果计划使用 API 模式 (非 SDK)，请在此时配置环境变量。

   - 复制 `.env.example` 到 `.env`
   - 编辑 `.env` 设置 `TDD_GUARD_ANTHROPIC_API_KEY` 等

   ```bash
   cp .env.example .env
   # 编辑 .env 文件...
   ```
5. **安装依赖**

   ```bash
   npm install
   ```
6. **构建项目**
   编译 TypeScript 代码和 TDD Guard 核心。

   ```bash
   npm run build
   ```

   > **注意**：只有构建完成后，插件才会生效。
   >
7. **项目初始化 (在目标项目中)**
   在你要使用插件的项目（任意目录）中运行：

   ```bash
   # 进入你的项目
   cd /path/to/your/project

   # 初始化 Superpowers
   npx superpowers-fusion init
   ```

---

### 方式 B：手动插件目录安装

如果 Marketplace 方式不可用，可以手动复制文件。

---

### Hooks 配置说明

插件的 hooks 配置存储在 `.claude/settings.local.json` 文件中，由 `init` 命令自动安装。

**工作原理**：

- `init` 命令将 hooks 配置写入项目的 `.claude/settings.local.json`
- Claude Code / OpenCode 从该文件读取并执行 hooks
- hooks 命令使用绝对路径，格式为：`cd "/path/to/superpowers-fusion" && node dist/src/cli/index.js verify-tdd`

**重要**：
- `hooks/hooks.json` 文件仅作为配置参考，Claude Code **不会**从该文件加载 hooks
- Hooks 必须在 `.claude/settings.local.json`（项目级）或 `~/.claude/settings.json`（全局）中配置
- 修改 hooks 配置后需要**重启 Claude Code / OpenCode** 才能生效

### OpenCode 兼容性

superpowers-fusion 完全兼容 OpenCode。OpenCode 的 `claude-code-hooks` 模块会读取 `.claude/settings.local.json` 并执行 hooks。

**注意**：
- `PreToolUse` hooks 对主会话和子代理（subagents）都生效
- `UserPromptSubmit` hooks 在子代理中会被跳过（防止递归）

### Windows 兼容性

hooks 命令会自动处理路径中的空格。确保 Node.js 在系统 PATH 中可用。

---

### CodexMCP 安装（可选）

如需双 Agent 协作功能：

```bash
claude mcp add codex -s user -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp
```

---

## 工作原理

### TDD Guard（Hooks）

系统自动拦截 `Edit` 和 `Write` 工具调用：

| 文件类型                                         | Tier   | 行为                                         |
| ------------------------------------------------ | ------ | -------------------------------------------- |
| `.md`, `README`, `LICENSE`, `.gitignore` | Tier 0 | ✅ 直接放行                                  |
| `.css`, `.json`, `.yaml`, `.toml`        | Tier 1 | ✅ 允许，仅记录                              |
| 普通 `.ts`, `.js`, `.py` 等                | Tier 2 | ⚠️ 需要测试或 `<!-- TDD-EXEMPT -->` 注释 |
| `/api/`, `/services/`, `/db/`, `/auth/`  | Tier 3 | 🛑 必须有失败测试（不允许豁免）              |

### 技能与命令

插件安装后，Claude 会加载以下命令：

- `/setup` - 初始化项目上下文
- `/new-change <name>` - 开始结构化变更
- `/archive <name>` - 归档已完成的变更
- `/revert` - 精细撤销

---

## 配置

编辑 `.env` 配置 TDD 行为：

```bash
# 启用/禁用 TDD 验证
TDD_VALIDATION_ENABLED=true

# tdd-guard 客户端 (sdk | api | cli)
VALIDATION_CLIENT=sdk

# 默认模型版本 (tdd-guard)
TDD_GUARD_MODEL_VERSION=claude-sonnet-4-0

# 仅当 VALIDATION_CLIENT=api 时需要
TDD_GUARD_ANTHROPIC_API_KEY=

# Tier 环境变量已废弃
# 改用 .claude/tdd-guard/data/config.json 和 instructions.md
```

---

## 项目结构

```
superpowers-fusion/
├── src/cli/            # CLI 实现 (init, verify-tdd)
├── src/adapters/       # tdd-guard 适配器
├── lib/                # 核心库 (risk-validator, test-status-checker)
├── tdd-guard/          # Vendored tdd-guard 核心 (dist 在此目录)
├── skills/             # Markdown 技能模板
├── commands/           # Markdown 命令模板
├── hooks/              # Hook 配置 (hooks.json, run-node.cmd)
├── context/            # 项目上下文模板
└── dist/               # 编译后的 JS 代码
```

---

## 故障排除

### Hook 不触发

1. 确认插件已启用：`claude /plugins` 应显示 superpowers-fusion
2. 检查 `.claude/settings.local.json` 中是否包含 `hooks` 配置
3. 运行 `npx superpowers-fusion init --force` 重新安装 hooks
4. 重启 Claude Code

### Windows 上找不到 Node.js

确保 Node.js 在系统 PATH 中。如果使用 `run-node.cmd` 包装器，可编辑该文件添加你的 Node.js 路径。

### tdd-guard 找不到

确保复制/链接了 `tdd-guard/` 目录（包含 `dist/` 子目录）。

---

## License

MIT
