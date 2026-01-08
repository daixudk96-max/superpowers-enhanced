# 整合 TDD Guard 核心

**变更 ID**: `integrate-tdd-guard-core`

## 摘要

将原版 `tdd-guard` 代码库（已放置于 `./tdd-guard/`）整合到 `superpowers-fusion`，以修复 TDD Hook 触发问题并提升可维护性。旧版 "Tier" 功能将迁移至 `tdd-guard` 原生的 `instructions.md` 和 `ignorePatterns` 机制。

## 问题描述

1. **Hook 不触发**：当前"融合版" TDD 实现存在 Bug，导致 `PreToolUse` Hook 无法正常触发。
2. **可维护性差**：自定义实现难以接收上游 `tdd-guard` 的修复和更新。
3. **Tier 混乱**：旧版 `TDD_DEFAULT_TIER` 环境变量与原版 `tdd-guard` 不兼容。

## 解决方案

### 核心策略：Vendoring（引入原版代码）+ 保留 Tier 自动判断

```
Claude Code 触发 Hook
         │
         ▼
   hooks/hooks.json 配置
   (使用 CLAUDE_PLUGIN_ROOT)
         │
         ▼
   verify-tdd.ts 入口
         │
         ├──→ lib/risk-validator.ts    ← Tier 0/1? 直接放行
         │    （保留 - Tier 自动判断）
         │
         └──→ tdd-guard 核心验证       ← Tier 2/3? 调用原版逻辑
              （引入原版代码）
```

### 关键决策

1. **保留** `lib/risk-validator.ts`：根据文件路径自动判断 Tier（0-3）
2. **保留** `lib/test-status-checker.ts`：根据 Tier 级别决定是否需要验证
3. **引入** `tdd-guard/` 核心：用于 Tier 2/3 的实际 TDD 验证逻辑

### Tier 自动判断规则（保留原有逻辑）

| 文件类型 | 自动 Tier | 行为 |
|----------|-----------|------|
| `.md`, `README`, `LICENSE` | Tier 0 | 直接放行 |
| `.css`, `.json`, `.yaml` | Tier 1 | 允许，仅记录 |
| 普通 `.ts/.js` | Tier 2 | 需要测试或豁免注释 |
| `/api/`, `/services/`, `/db/` | Tier 3 | 必须有失败测试 |


## 关键文件

- **需合并的依赖**：`@anthropic-ai/sdk`, `uuid`, `zod`（详见 `tasks.md`）
- **配置变量**：`VALIDATION_CLIENT`, `TDD_GUARD_MODEL_VERSION`（**不是** `TDD_DEFAULT_TIER`）
- **数据目录**：`.claude/tdd-guard/data/`（包含 `config.json`, `instructions.md`, `test.json`）

## 风险

- **依赖冲突**：共享依赖的版本不一致（缓解措施：使用较新版本）。
- **路径解析**：`tdd-guard` 依赖 `CLAUDE_PROJECT_DIR` 环境变量（由 Claude Code 自动设置）。

## 验证方式

- `npm run build` 必须通过。
- `npm test` 必须通过。
- 手动验证：`superpowers-fusion verify-tdd` 应输出 tdd-guard 日志。
- 端到端验证：Claude Code 应阻止没有测试的文件编辑。
