# Proposal: Unify Skill Workflow Chain

## 概述

保留 Fusion 所有 TS 增强功能，同时恢复原版 Superpowers 的 Skill 链调用模式，确保 Worktree 工作流正确完整。

## 动机

当前 Fusion 项目存在以下问题：
1. **Worktree 创建时机不一致** - 原版在 brainstorming Phase 4 创建，Fusion 在 writing-plans 后创建
2. **Skill 链断裂** - Skills 末尾缺少明确的 "下一步" 引导，Agent 容易跳过步骤
3. **Command 与 Skill 职责重叠** - `implement.md` 包含与 `executing-plans/SKILL.md` 重复的内容

## 范围

### In Scope
- 修改 3 个现有 Skills: `writing-plans`, `executing-plans`, `finishing-a-development-branch`
- 新建 2 个 Skills: `creating-changes`, `archiving-changes`
- 精简 `commands/implement.md` 删除重复内容
- 统一所有 Skills/Commands 末尾的 handoff 模式

### Out of Scope
- TS 代码逻辑变更 (本次仅修改 `.md` 文档)
- Hooks 系统改动
- 新增测试用例

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| Worktree 创建时机 | `implement.ts` 执行时 (现状) | 避免过早创建导致资源浪费 |
| Skill vs Command 职责 | Command 为入口 + 参数解析，Skill 为流程指导 | 符合原版设计哲学 |
| 末尾 handoff 格式 | `## 下一步\n**REQUIRED:** 运行 /xxx 或调用 superpowers:xxx` | 统一且醒目 |

## 相关变更

| Capability | 类型 | 描述 |
|------------|------|------|
| skill-lifecycle-orchestration | MODIFIED | Skill 生命周期流程增强 |
| change-management-skills | ADDED | 新建变更管理相关 Skills |
| command-skill-alignment | MODIFIED | Command 与 Skill 对齐 |
