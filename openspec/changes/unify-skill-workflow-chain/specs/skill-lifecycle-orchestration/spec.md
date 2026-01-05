# Skill Lifecycle Orchestration

## MODIFIED Requirements

### Requirement: Skill handoff pattern standardization
每个 Skill MUST 在末尾包含标准化的 handoff 引导，指向下一个 Skill 或 Command。

#### Scenario: Agent 完成 brainstorming 后获得下一步指引
- **WHEN** Agent 完成 brainstorming Skill
- **THEN** Skill 末尾显示 "下一步运行 /new-change {name}"

#### Scenario: Agent 完成 executing-plans 后获得 finish 指引
- **WHEN** Agent 完成所有任务
- **THEN** Skill 末尾显示 "调用 superpowers:finishing-a-development-branch，然后运行 /archive"

### Requirement: Writing-plans user review gate
`writing-plans` Skill MUST 在 Execution Handoff 阶段包含用户审阅阻断。

#### Scenario: Agent 不能跳过用户审阅
- **WHEN** Agent 完成计划编写到达 Execution Handoff 阶段
- **THEN** 必须显示 "⚠️ 必须等待用户确认后才继续" 并暂停等待用户回复

#### Scenario: 用户确认后继续执行
- **WHEN** Agent 显示审阅提示且用户回复 "ok"
- **THEN** Agent 继续执行 Worktree 创建和执行方式选择

### Requirement: Executing-plans Step 0 environment check
`executing-plans` Skill MUST 在开始前进行环境确认。

#### Scenario: 检测到缺少 Worktree 时中止
- **WHEN** Agent 开始 executing-plans 且 Step 0 检查发现没有 Worktree
- **THEN** 提示用户运行 `/implement` 创建 Worktree

#### Scenario: 正常恢复中断的任务
- **WHEN** `.fusion/status.json` 存在未完成任务且 Agent 开始 executing-plans
- **THEN** Step 0 从上次中断位置恢复

### Requirement: Finishing-branch Step 5 worktree cleanup
`finishing-a-development-branch` Skill MUST 包含 Step 5 Worktree 清理步骤。

#### Scenario: Merge 选项后清理 Worktree
- **WHEN** 用户选择 "Merge locally" 且合并完成
- **THEN** 执行 `git worktree remove` 清理

#### Scenario: Keep 选项保留 Worktree
- **WHEN** 用户选择 "Keep as-is"
- **THEN** Worktree 保留且提示手动清理
