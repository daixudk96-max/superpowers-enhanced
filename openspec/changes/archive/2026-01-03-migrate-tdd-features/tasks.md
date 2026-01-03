# Tasks: Migrate TDD-Guard Features ✅ COMPLETE

## Phase 0: 基础设施准备 ✅

- [x] **0.1** 添加依赖 `zod` 和 `minimatch`
- [x] **0.2** 创建 `lib/storage.ts` (120L)
- [x] **0.3** 创建 `lib/schemas.ts` (115L)
- [x] **0.4** 扩展 `lib/config-loader.ts`
- [x] **0.5** 更新 `.env.example`

---

## Phase 1: 完整移植 tdd-guard ✅

- [x] **1.1** 创建 `lib/guard-manager.ts` (123L)
- [x] **1.2** 创建 `lib/eslint-runner.ts` (165L)
- [x] **1.3** 创建 `lib/lint-notifier.ts` (122L)
- [x] **1.4** 创建 `lib/test-status-checker.ts` (139L)
- [x] **1.5** 更新 `hooks/postToolEdit.ts` - 添加 `postToolEditWithPipeline`
- [x] **1.6** 创建 `src/cli/tdd-toggle.ts` (58L)
- [x] **1.7** 注册命令到 CLI
- [x] **1.8** 创建 `hooks/userPromptHandler.ts` (100L)
- [x] **1.9** TypeScript 编译验证通过

---

## Phase 2: 整合 Fusion 增强 ✅

- [x] **2.1** 创建 `lib/workflow-middleware.ts` (176L)
- [x] **2.2** 创建 `lib/pipeline.ts` (308L)
- [x] **2.3** 更新 `hooks/preToolEdit.ts` - 添加 `preToolEditWithPipeline`
- [x] **2.4** 更新 `hooks/postToolEdit.ts` - 添加 `postToolEditWithPipeline`
- [x] **2.5** 添加 `implementWithWorkflow` 到 `commands/implement.ts`
- [x] **2.6** 更新 CLAUDE.md 文档

---

## Phase 3: 单元测试 ✅

- [x] **3.1** 创建 `tests/guard-manager.test.ts` (5 tests)
- [x] **3.2** 创建 `tests/workflow-middleware.test.ts` (14 tests)
- [x] **3.3** 创建 `tests/pipeline.test.ts` (7 tests)
- [x] **3.4** 全部 43 个测试通过

---

## 验证结果 ✅

- TypeScript 编译通过
- Vitest 43/43 测试通过
- 向后兼容现有功能

## 实现统计

| 指标 | 数值 |
|------|------|
| 新建文件 | 14 |
| 代码行数 | ~1800 |
| 测试数量 | 43 |
