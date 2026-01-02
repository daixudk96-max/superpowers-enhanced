# Change: sync-context-docs

> 归档完成的 Change 时自动分析并提议更新 context/ 下的项目文档（product.md, tech-stack.md, workflow.md）

## Why

Conductor 在完成 Track 后会自动"提议"更新产品文档，确保项目文档与代码变更保持同步。目前 Superpowers-Fusion 的 `/archive` 命令仅关注归档和清理，缺少此功能，导致 context/ 下的文档可能与实际项目状态脱节。

## What Changes

1. 新增 `lib/doc-sync.ts` 模块，负责：
   - 读取 change 的 `proposal.md` 和 `specs/` 内容
   - 调用 LLM API（通过现有 `lib/api-client.ts`）分析并生成更新建议
   - 展示 diff 供用户确认后应用

2. 修改 `commands/archive.ts`，在归档前触发文档同步流程

3. 添加 CLI 选项：
   - `--skip-docs`：跳过文档同步

## Impact

- **Affected specs**: N/A (new capability)
- **Affected code**: `commands/archive.ts`, `lib/doc-sync.ts` (new), `lib/api-client.ts` (reuse)
- **Risk level**: Low
  - 使用现有 API 客户端，无需新增依赖
  - 用户确认机制确保不会自动覆盖

## Design Decision

> [!NOTE]
> 采用 LLM 直接分析方案（用户已确认），通过 `lib/api-client.ts` 调用 AI 服务分析 proposal 并生成更新建议。
