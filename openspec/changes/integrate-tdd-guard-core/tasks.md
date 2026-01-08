# 任务清单：整合 TDD Guard 核心

## 0. 架构关键点（必读）

**不是完全替换，而是融合！** 保留以下 superpowers-fusion 原有逻辑：

- ✅ **保留** `lib/risk-validator.ts` - Tier 自动判断（根据文件路径）
- ✅ **保留** `lib/test-status-checker.ts` - 根据 Tier 决定验证严格程度
- ✅ **保留** `src/hooks/preToolEdit.ts` - Hook 入口（调用上述逻辑）
- 🆕 **引入** `tdd-guard/` - 仅用于 Tier 2/3 的实际验证逻辑

## 1. 信息收集与验证


- [x] 分析 `tdd-guard/src/config/Config.ts` 确认配置架构。
  - **发现**：没有 "tier" 设置。核心配置是 `VALIDATION_CLIENT` (sdk|api|cli) 和 `TDD_GUARD_MODEL_VERSION`。
- [x] 审查 `tdd-guard/package.json` 的依赖项。

## 2. 依赖管理

- [x] 将 `tdd-guard/package.json` 的依赖合并到根目录 `package.json`。
  - **运行时依赖**：
    - `@anthropic-ai/claude-agent-sdk`
    - `@anthropic-ai/sdk`
    - `dotenv`
    - `minimatch`
    - `uuid`
    - `zod`
  - **开发依赖**：
    - `@types/uuid`
  - **操作**：运行 `npm install <依赖列表>`
- [x] 检查版本冲突（特别是 `zod` 和 `dotenv`）。如果 `tdd-guard` 版本更新则使用该版本。

## 3. 配置与环境

- [x] 更新 `tsconfig.json`：
  - 在 `include` 数组中添加 `"tdd-guard"`。
  - 添加路径映射：`"@tdd-guard/*": ["./tdd-guard/src/*"]`。
- [x] 更新 `.env` 和 `.env.example`：
  - 添加 `VALIDATION_CLIENT=sdk`（默认值）。
  - 添加 `TDD_GUARD_MODEL_VERSION=claude-sonnet-4-0`。
  - 添加 `TDD_GUARD_ANTHROPIC_API_KEY=`（留空）。
  - 注意："Tier" 设置已废弃，不要包含。

## 4. 代码桥接（适配器）

- [x] 创建 `src/adapters/tdd-guard-adapter.ts`：
  - 从 `@tdd-guard/index` 导入 `Config`, `Validator`。
  - 实现 `verifyTdd(cwd: string, args: string[])` 函数。
  - 将 `superpowers-fusion` 上下文映射到 `tdd-guard` 期望的输入格式。
- [x] 重构 `src/cli/verify-tdd.ts`：
  - 用适配器调用替换现有逻辑。

## 5. 验证

- [x] **构建**：`npm run build`（必须无类型错误通过）。
- [x] **测试**：`npm test`（确保现有测试通过）。
- [ ] **手动验证**：在测试文件夹中运行 `superpowers-fusion verify-tdd`。
- [ ] **端到端**：重启 Claude Code，尝试创建没有测试的文件，验证 TDD Guard 是否使用新核心进行拦截。

## 6. Tier 功能迁移（可选增强）

- [x] 创建 `src/cli/tier.ts` 命令来管理 Tier 预设：
  - `fusion tier set 1` → 生成宽松的 `instructions.md` + 宽泛的 `ignorePatterns`
  - `fusion tier set 2` → 使用默认规则（不创建自定义文件）
  - `fusion tier set 3` → 生成严格的 `instructions.md`
- [x] 更新 `init` 命令以可选设置初始 Tier 级别。
- [x] 从 `.env` 和 `init.ts` 中移除旧版 `TDD_DEFAULT_TIER` 环境变量。

## 7. 原版功能验证

- [x] 验证 **忽略模式 (Ignore Patterns)** 功能：
  - 创建 `.claude/tdd-guard/data/config.json` 并设置 `ignorePatterns`。
  - 编辑匹配的文件；验证 TDD Guard 跳过该文件。
- [x] 验证 **自定义指令 (Custom Instructions)** 功能：
  - 创建 `.claude/tdd-guard/data/instructions.md` 并编写自定义规则。
  - 编辑文件；验证 TDD Guard 使用自定义规则。
