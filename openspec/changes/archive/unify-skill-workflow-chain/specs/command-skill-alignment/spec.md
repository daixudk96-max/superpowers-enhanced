# Command Skill Alignment

## MODIFIED Requirements

### Requirement: Implement.md simplification
`commands/implement.md` MUST 精简删除与 `executing-plans/SKILL.md` 重复的内容。

#### Scenario: implement.md 只包含入口信息
- **WHEN** 当前 implement.md 约 93 行且删除重复内容 (任务解析、Codex 原型、实现循环等)
- **THEN** 精简为约 15 行只保留用法和 Skill 调用

#### Scenario: 任务执行逻辑由 Skill 负责
- **WHEN** 用户运行 `/implement feature-x` 且 implement.ts 创建 Worktree 完成
- **THEN** Agent 调用 `superpowers:executing-plans` 执行实际任务

### Requirement: Command tail handoff to Skill
每个 Command MUST 在末尾包含对应 Skill 的调用引导。

#### Scenario: new-change.md 引导到 writing-plans
- **WHEN** `/new-change` 执行完成且 Agent 查看 Command 末尾
- **THEN** 看到 "调用 superpowers:writing-plans"

#### Scenario: implement.md 引导到 executing-plans
- **WHEN** `/implement` 执行完成且 Agent 查看 Command 末尾
- **THEN** 看到 "**REQUIRED SUB-SKILL:** Use superpowers:executing-plans"

### Requirement: Skill tail handoff to Command
需要用户触发的 Command 时 Skill MUST 在末尾包含命令引导。

#### Scenario: brainstorming 引导到 /new-change
- **WHEN** Agent 完成 brainstorming 且查看 Skill 末尾
- **THEN** 看到 "下一步运行 /new-change {name}"

#### Scenario: finishing-branch 引导到 /archive
- **WHEN** Agent 完成 finishing-a-development-branch 且查看 Skill 末尾
- **THEN** 看到 "下一步运行 /archive {name}"
