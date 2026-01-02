# 变更提案: restore-workflow-commands

> 修复 superpowers-fusion 的 Agent 工作流引导，激活已实现但未连接的 TDD 功能模块，并引入模块化规则系统

## 澄清说明

> [!IMPORTANT]
> **关于脚本改造**：本提案**不会将 TypeScript CLI 脚本改成 Markdown 文件**。我们只是修改 `claude-plugin.json` 的 `entry_points.commands` 从 JS 文件改为 Markdown 目录，让 Agent 能看到 Markdown 命令。TS CLI 保留为 `bin` 入口供人工调用。

> [!NOTE]
> **关于 AST 检查**：`test-quality-checker.ts` 已实现以下三项检查功能，无需新增：
> - ✅ 空测试检测 (`rejectEmptyTests`)
> - ✅ 缺失断言检测 (`rejectMissingAssertions`)
> - ✅ 平凡断言检测 (`rejectTrivialAssertions`)
>
> **当前问题**：这些检查只在编辑测试文件时触发。本提案将扩展为：编辑源代码时也检查对应测试文件的质量。

## 背景 (Why)

当前 `superpowers-fusion` 项目存在三类问题：

### 问题一：工作流引导断裂

- Agent 执行命令后只看到 "Done" 日志，无法获得"下一步"指令
- 关键命令 `brainstorm` 和 `execute-plan` 未在插件入口注册
- `claude-plugin.json` 的 `entry_points.commands` 指向 JS 文件而非 Markdown

### 问题二：TDD 功能未激活

| 功能 | 位置 | 状态 |
| --- | --- | --- |
| **AI 验证** | `lib/api-client.ts` → `validateWithAI()` | ❌ 未被调用 |
| **AST 检查** | `lib/test-quality-checker.ts` → `checkTestQuality()` | ❌ 仅在编辑测试文件时触发 |
| **测试通过检查** | `hooks/postToolEdit.ts` → `parseTestOutput()` | ❌ 未被主流程使用 |

### 问题三：Init 命令缺陷

`src/cli/init.ts` 未写入关键 TDD 默认值到 `.env`

## 变更内容 (What Changes)

### Part A: 修复命令入口 (P0)

1. 修改 `claude-plugin.json`，将 `entry_points.commands` 改为 `"./commands"`
2. 补全 `write-plan.md` 命令
3. 增强 TS 命令返回提示

### Part B: 激活 TDD 功能 (P0)

1. 在 `preToolEdit.ts` 中添加对 `validateWithAI()` 的调用（Tier 2/3 时）
2. 在 `preToolEdit.ts` 中添加对 `checkTestQuality()` 的调用（编辑源代码时检查对应测试文件）
3. 确保 `postToolEdit` 在所有编辑后触发

### Part C: 修复 Init 命令 (P0)

更新 `src/cli/init.ts`，写入完整的 TDD 默认配置到 `.env`

### Part D: 引入模块化规则系统 (P1)

1. 创建 `.claude/rules/standard/` 目录结构
2. 从 claude-codepro 移植并**适配** `tdd-enforcement.md`
3. 从 claude-codepro 移植并**适配** `workflow-enforcement.md`

**适配要点**:

| claude-codepro 原命令 | superpowers-fusion 适配后 |
| --- | --- |
| `/plan` | `/write-plan` |
| `/implement` | `/execute-plan` |
| `/verify` | 阶段验证（Phase Checkpoint） |
| `/setup` | `/brainstorm` (作为起点) |

### Part E: 引入检查点机制 (P2)

1. 扩展 `/archive` 命令，自动创建 checkpoint commit
2. 实现 `attachGitNote()` 函数，附加任务摘要
3. 在 `tasks.md` 中记录 commit SHA

### Part F: 增强测试报告集成 (P2)

1. 从 tdd-guard 移植并适配 Vitest Reporter 配置模板
2. 创建 `scripts/install-reporter.js` 自动配置

## 影响范围

- **受影响文件**:
  - `claude-plugin.json`
  - `hooks/preToolEdit.ts` (添加 AI 验证和 AST 检查调用)
  - `src/cli/init.ts` (补全 .env 写入)
  - `commands/write-plan.md` (新增)
  - `.claude/rules/standard/*.md` (新增，从 claude-codepro 适配)
  - `commands/archive.ts` (扩展检查点功能)
  - `scripts/install-reporter.js` (新增)
- **风险等级**: Tier-2 (普通代码修改)

## 成功标准

- [ ] Agent 执行 `/setup` 后能看到下一步指引
- [ ] `preToolEdit` 在 Tier 2/3 时调用 AI 验证
- [ ] `preToolEdit` 检查源代码对应的测试文件质量
- [ ] `init` 命令正确写入所有 TDD 默认配置
- [ ] 规则文件已适配 superpowers-fusion 命令体系
- [ ] `/archive` 命令创建检查点 commit 并附加 git note
- [ ] 现有测试 `npm run test` 继续通过
