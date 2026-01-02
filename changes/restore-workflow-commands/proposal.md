# Change: restore-workflow-commands

> 恢复缺失的 Conductor 工作流：交互式设置、状态报告和实现逻辑。

## 为什么 (Why)

当前的 `superpowers-fusion` 实现仅包含用于 `/setup` 的基本文件脚手架，并且完全缺少 `/status` 和 `/implement` 命令。这与原始的 Conductor 相比造成了功能差距，限制了 `CLAUDE.md` 中承诺的“上下文管理”能力。我们需要移植这些工作流以提供完整的“Superpowers”体验。

## 变更内容 (What Changes)

1.  **增强 `/setup`**：
    -   从 `setup.toml` 移植用于产品、技术栈和工作流的交互式问卷。
    -   实现褐地 (brownfield) 项目检测。

2.  **添加 `/status`**：
    -   从 `status.toml` 移植状态报告逻辑。
    -   读取 `changes/` 和 `.fusion/status.json` 以报告进度。

3.  **添加 `/implement`**：
    -   从 `implement.toml` 移植轨道 (track) 选择和执行逻辑。
    -   与 `superpowers:executing-plans` 技能集成。

## 影响 (Impact)

-   **受影响的规范**: `setup.ts`, `CLAUDE.md`
-   **风险等级**: 中等 (添加了重要的新逻辑，但主要是增量式的)。
