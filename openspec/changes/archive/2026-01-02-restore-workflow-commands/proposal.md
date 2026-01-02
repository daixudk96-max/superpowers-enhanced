# Change: restore-workflow-commands

> 恢复缺失的 Conductor 工作流：交互式设置、状态报告和实现逻辑。

## Why

当前的 `superpowers-fusion` 实现仅包含用于 `/setup` 的基本文件脚手架，并且完全缺少 `/status` 和 `/implement` 命令。这与原始的 Conductor 相比造成了功能差距，限制了 `CLAUDE.md` 中承诺的"上下文管理"能力。

## 移植策略 (Migration Strategy)

**技术栈差异**：
- **Conductor**: TOML 文件定义 AI 提示词（无实际代码）
- **Superpowers-fusion**: TypeScript 实现命令逻辑

**采用混合策略（倾向 B）**：
1. 保留 TOML 作为可迭代的提示词资产，便于后续同步和热更新
2. 新增 TS 层做解析与执行（上下文收集、文件读写、状态保存）
3. 对需要程序化逻辑的部分（技术栈检测、任务分派）用 TypeScript 实现可测试函数

## What Changes

1.  **增强 `/setup`**：
    -   从 `setup.toml` 移植交互式问卷（产品、技术栈、工作流）
    -   实现褐地 (brownfield) 项目检测（git status、package.json、常见配置文件）
    -   创建 `.fusion/` 和 `changes/` 目录

2.  **添加 `/status`**：
    -   从 `status.toml` 移植状态报告逻辑
    -   读取 `changes/` 和 `.fusion/status.json` 报告进度

3.  **添加 `/implement`**：
    -   从 `implement.toml` 移植轨道选择和执行逻辑
    -   与 `superpowers:executing-plans` 技能集成

## Impact

-   **受影响的规范**: `setup.ts`, `CLAUDE.md`
-   **风险等级**: 中等

## Design Decision

> [!IMPORTANT]
> 选择混合策略而非全量翻译，原因：
> 1. 与原 Conductor 配置保持兼容
> 2. 提示词可热更新，无需发版
> 3. 利于对比验证行为一致性
