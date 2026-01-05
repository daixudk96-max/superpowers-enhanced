# Change Management Skills

## ADDED Requirements

### Requirement: Creating-changes Skill
系统 SHALL 提供 `skills/creating-changes/SKILL.md` 用于封装变更创建流程。

#### Scenario: 从 brainstorming 过渡到变更创建
- **WHEN** Agent 完成 brainstorming 且需要创建变更目录
- **THEN** 调用 creating-changes Skill 引导运行 `/new-change`

#### Scenario: 变更创建后自动过渡到计划编写
- **WHEN** `/new-change` 执行完成且变更目录已创建
- **THEN** Skill 末尾引导调用 `writing-plans`

### Requirement: Archiving-changes Skill
系统 SHALL 提供 `skills/archiving-changes/SKILL.md` 用于封装变更归档流程。

#### Scenario: 从 finishing-branch 过渡到归档
- **WHEN** Agent 完成 finishing-a-development-branch 且需要归档变更
- **THEN** 调用 archiving-changes Skill 引导运行 `/archive`

#### Scenario: 归档时自动清理 Worktree
- **WHEN** 用户运行 `/archive {name}` 触发归档流程
- **THEN** 自动合并分支 (如需)、删除 Worktree、生成 metadata.json

#### Scenario: 归档完成后可开始新变更
- **WHEN** 归档成功且用户查看 Skill 末尾
- **THEN** 提示可运行 `/new-change` 开始新变更
