# Proposal: Migrate TDD-Guard Features

## Overview
将 `tdd-guard` 的缺失功能迁移到 `superpowers-fusion`，使其成为完整的 TDD 强制执行解决方案。

## Background
经分析，`superpowers-fusion` 已继承 `tdd-guard` 的核心 TDD 强制逻辑（Risk Tiers、AST 检查、AI 验证回退），但存在以下缺口：

1. **Linter 强制集成** - 缺少 `PostToolUse` 钩子中的 ESLint 自动执行
2. **多语言 Reporters** - 仅有 VitestReporter，缺少 Jest/Pytest/PHPUnit/Go/Rust/Storybook
3. **多语言支持** - `language-adapter.ts` 缺少 PHP 和 Storybook 模式
4. **交互式控制** - 缺少 `/tdd-toggle` 等运行时切换命令

## Migration Feasibility (Codex Analysis)

| 功能 | 复杂度 | 可直接复制 | 需要适配 |
|------|--------|-----------|----------|
| ESLint Runner | 中 | 核心逻辑 (~83 行) | 配置读取、状态目录 |
| PostToolLint | 中 | Hook 框架 | 事件接口、持久化路径 |
| Jest Reporter | 高 | Schema 定义 | 与 Fusion 统一、依赖调整 |
| Pytest/PHPUnit/Go/Rust | 高 | 无法直接复制 | 需独立发布为语言包 |
| PHP/Storybook 语言支持 | 低 | 正则扩展 | AST 检查需跳过 |
| /tdd-toggle 命令 | 中-高 | 无 | 需新建命令框架 |

## Proposed Strategy

### Phase 1: 统一测试结果 Schema（先决条件）
- 定义 `.fusion/test-results.json` 的标准 schema
- 将现有 `FusionVitestReporter` 适配到新 schema
- 添加 Jest Reporter（复用 tdd-guard 逻辑，调整输出路径）

### Phase 2: 扩展语言支持
- 在 `language-adapter.ts` 添加 PHP 和 Storybook 模式
- 对非 JS 语言跳过 AST 质量检查，仅做正则级别检测

### Phase 3: Linter 集成
- 复制 `ESLint.ts` 核心逻辑到 `lib/eslint-runner.ts`
- 在 `postToolEdit.ts` 或新增 `postToolLint.ts` 中集成
- 初期实现"警告不阻断"模式

### Phase 4: 交互式控制（可选）
- 添加 CLI 子命令 `superpowers-fusion tdd-toggle`
- 通过 `.fusion/config.json` 覆盖 `.env` 中的 TDD 开关

## Key Dependencies
- `@babel/parser` (已存在，用于 AST 检查)
- `eslint` (peer dependency，项目自行安装)
- 各语言 reporters 需独立发布（暂不纳入本次迁移范围）

## Out of Scope
- Pytest, PHPUnit, Go, Rust, Storybook reporters（需独立语言包，建议后续 OpenSpec 提案）
- Go/Rust 的 Linter 集成 (golangci, clippy)

## Success Criteria
1. ESLint 在编辑 JS/TS 文件后自动执行并报告问题
2. Jest 测试结果写入 `.fusion/test-results.json`
3. PHP 和 Storybook 文件被正确识别和分类
4. `superpowers-fusion tdd-toggle on|off` 命令可用
