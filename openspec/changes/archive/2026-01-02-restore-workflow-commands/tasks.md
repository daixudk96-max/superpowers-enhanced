# 任务清单: restore-workflow-commands

## Phase 1: 修复插件命令入口

- [x] 1.1 修改 `claude-plugin.json` 的 `entry_points.commands` 从 `./dist/commands/index.js` 改为 `./commands`  <!-- Risk: Tier-2 -->
- [x] 1.2 确保 `commands/brainstorm.md` 和 `commands/execute-plan.md` 符合 superpowers 规范 (包含 frontmatter)  <!-- Risk: Tier-1 -->
- [x] 1.3 新增 `commands/write-plan.md` 从原版 superpowers 复制  <!-- Risk: Tier-1 -->

## Phase 2: 激活 AI 验证功能

- [x] 2.1 修改 `hooks/preToolEdit.ts`：在 Tier 2/3 被阻止时调用 `validateWithAI()` 作为二次判断  <!-- Risk: Tier-3 -->
- [x] 2.2 添加配置检查：仅当 `TDD_VALIDATION_CLIENT=api` 且有 API Key 时才调用外部 API  <!-- Risk: Tier-2 -->
- [ ] 2.3 添加测试用例覆盖 AI 验证逻辑  <!-- Risk: Tier-2 -->

## Phase 3: 激活 AST 检查功能

- [x] 3.1 修改 `hooks/preToolEdit.ts`：在编辑源代码时，查找对应测试文件并调用 `checkTestQuality()`  <!-- Risk: Tier-3 -->
- [x] 3.2 添加 `findCorrespondingTestFile()` 工具函数  <!-- Risk: Tier-2 -->
- [ ] 3.3 添加测试用例覆盖 AST 检查集成  <!-- Risk: Tier-2 -->

## Phase 4: 修复 Init 命令

- [x] 4.1 更新 `src/cli/init.ts`：补全 `.env` 写入的 TDD 配置项  <!-- Risk: Tier-2 -->
  - `TDD_VALIDATION_CLIENT=sdk`
  - `TDD_AST_CHECKS_ENABLED=true`
  - `TDD_REJECT_EMPTY_TESTS=true`
  - `TDD_REJECT_MISSING_ASSERTIONS=true`
  - `TDD_REJECT_TRIVIAL_ASSERTIONS=true`

## Phase 5: 增强 TS 命令的返回提示

- [x] 5.1 修改 `commands/setup.ts`：在操作完成后返回 Markdown 提示  <!-- Risk: Tier-2 -->
- [x] 5.2 修改 `commands/new-change.ts`：在操作完成后返回下一步指引  <!-- Risk: Tier-2 -->
- [x] 5.3 创建通用的 `readMarkdownPrompt()` 工具函数  <!-- Risk: Tier-2 -->

## Phase 6: 验证 (P0 阶段)

- [x] 6.1 运行现有测试 `npm run test` 确保所有测试通过  <!-- Risk: Tier-0 -->
- [x] 6.2 在 Claude Code 中手动测试 `/setup` 命令是否返回引导提示  <!-- Risk: Tier-0 -->
- [x] 6.3 测试 AI 验证 fallback 逻辑 (API -> SDK -> AST-only)  <!-- Risk: Tier-0 -->

---

## Phase 7: 引入模块化规则系统 (P1)

- [x] 7.1 创建 `.claude/rules/standard/` 目录结构  <!-- Risk: Tier-1 -->
- [x] 7.2 从 claude-codepro 移植并**适配** `tdd-enforcement.md`  <!-- Risk: Tier-2 -->
  - 替换 `/plan` → `/write-plan`
  - 替换 `/implement` → `/execute-plan`
  - 更新示例和验证清单
- [x] 7.3 从 claude-codepro 移植并**适配** `workflow-enforcement.md`  <!-- Risk: Tier-2 -->
  - 替换 Plan-Implement-Verify → Brainstorm-WritePlan-Execute
  - 更新状态追踪格式

## Phase 8: 引入检查点机制 (P2)

- [x] 8.1 扩展 `/archive` 命令，自动创建 checkpoint commit  <!-- Risk: Tier-2 -->
- [x] 8.2 实现 `attachGitNote()` 函数，附加任务摘要  <!-- Risk: Tier-2 -->
- [x] 8.3 在 tasks.md 中记录 commit SHA (格式: `[checkpoint: abc1234]`)  <!-- Risk: Tier-1 -->

## Phase 9: 增强测试报告集成 (P2)

- [x] 9.1 从 tdd-guard 移植并适配 Vitest Reporter 配置模板  <!-- Risk: Tier-2 -->
  - 适配 `superpowers-fusion` 的 Storage 接口
  - 更新 imports 和类型定义
- [x] 9.2 创建 `scripts/install-reporter.js` 自动配置  <!-- Risk: Tier-2 -->
  - 检测项目使用的测试框架 (Vitest/Jest)
  - 自动修改 vitest.config.ts 添加 reporter

## Phase 10: 最终验证

- [x] 10.1 运行完整测试套件  <!-- Risk: Tier-0 -->
- [x] 10.2 验证规则文件被 Claude Code 正确加载  <!-- Risk: Tier-0 -->
- [x] 10.3 验证 Vitest Reporter 正确输出测试结果  <!-- Risk: Tier-0 -->

---

**Legend**:
- `[ ]` = Pending
- `[x]` = Complete
- `[/]` = In Progress
- `[-]` = Skipped

