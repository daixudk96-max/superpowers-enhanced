# 变更: restore-superpowers-canon

> 恢复原版 `obra/superpowers` 的完整 Skills 功能，将 Fusion 扩展有机嵌入原版结构，恢复子技能引用链，适配现有功能流程。

## 为什么

1. **SKILL.md 内容简化**：原版详细内容（示例、流程图、验证清单）丢失
2. **子技能引用链断裂**：Fusion 缺少 `REQUIRED SUB-SKILL: Use superpowers:xxx`
3. **工作流无法自动调用**：技能之间的调用链失效

## 变更内容

### 1. 有机整合策略（非末尾追加）

| Skill | Fusion 扩展 | 嵌入位置 |
| --- | --- | --- |
| test-driven-development | Risk Tier 表格 | "When to Use / Preconditions" 节 |
| test-driven-development | 豁免流程 | "The TDD Cycle" 各步骤内 |
| brainstorming | Codex 协作 | "Exploring approaches" 节 |
| writing-plans | Risk Tier 任务标注 | "Task Structure" 节 |
| writing-plans | Codex 协作 | "Plan Document Header" 节 |
| executing-plans | Codex prototype/review | "Execute Batch" 各步骤内 |
| executing-plans | SHA 追踪 | "Commit" 步骤内 |

### 2. 恢复子技能引用链

从原版提取的 REQUIRED SUB-SKILL 引用：

| Skill | 引用 | 位置 |
| --- | --- | --- |
| executing-plans | `superpowers:finishing-a-development-branch` | Step 5 完成开发 |
| writing-plans | `superpowers:executing-plans` | Plan Header + Parallel 选项 |
| writing-plans | `superpowers:subagent-driven-development` | Subagent 选项 |
| brainstorming | `superpowers:using-git-worktrees` | "After the Design" 节 |
| brainstorming | `superpowers:writing-plans` | "After the Design" 节 |

### 3. 现有功能流程适配

| Fusion 命令 | 适配方式 |
| --- | --- |
| `/implement` | 映射到 `executing-plans` Step 2-6，在步骤内嵌入 Codex prototype/review |
| `/new-change {id}` | 触发 `writing-plans` Skill 生成 proposal.md + tasks.md |
| `/archive {id}` | 在 `executing-plans` 完成后触发，整合到 Step 5 |
| `/revert {id}` | 作为变更处理，需 `writing-plans` + `executing-plans` |

### 4. 多语言 Reporters 移植

从 `tdd-guard/reporters` 移植缺失的多语言 TDD Reporters：

| 语言 | 源文件 | 目标位置 | 状态 |
| --- | --- | --- | --- |
| Go | `tdd-guard/reporters/go/` | `lib/reporters/go/` | ❌ 待移植 |
| Ruby | `tdd-guard/reporters/rspec/` | `lib/reporters/ruby/` | ❌ 待移植 |
| Rust | `tdd-guard/reporters/rust/` | `lib/reporters/rust/` | ❌ 待移植 |
| PHP | `tdd-guard/reporters/phpunit/` | `lib/reporters/php/` | ❌ 待移植 |
| Storybook | `tdd-guard/reporters/storybook/` | `lib/reporters/storybook/` | ❌ 待移植 |

**install-reporter.ts 扩展**：

添加对以上语言的安装逻辑，输出相应的配置说明。


## 影响范围

### 受影响 Skills

| Skill | 变更类型 | 行数变化 | 新功能适配 |
| --- | --- | --- | --- |
| test-driven-development | 恢复+整合 | 68 → ~400 | Risk Tier 嵌入 |
| brainstorming | 恢复+整合 | 40 → ~60 | Codex 协作嵌入 |
| writing-plans | 恢复+整合 | 63 → ~130 | Risk Tier + Codex + OpenSpec |
| executing-plans | 恢复+整合 | 75 → ~90 | Codex prototype + SHA 追踪 |
| using-superpowers | 恢复+整合 | 64 → ~100 | **Risk Tier + Codex + OpenSpec 概念介绍** |

### using-superpowers 新功能适配

作为入口技能，需要告知 AI 关于 Fusion 的新概念：

| 新功能 | 嵌入位置 | 内容 |
| --- | --- | --- |
| Risk Tier 系统 | "Skill Types" 节 | 说明 Tier 0-3 对 TDD 的要求 |
| Codex 协作 | 新增 "Collaboration" 节 | 说明何时调用 Codex |
| OpenSpec 变更 | 新增 "Change Management" 节 | 说明 /new-change, /archive 命令 |


### 风险评估

- **低风险**：Markdown 文档变更，不涉及运行时代码
- **保留 Fusion 功能**：Risk Tier、Codex 协作完整保留并嵌入
- **恢复自动调用**：子技能引用链恢复

## 成功标准

- [ ] 每个 SKILL.md 包含原版核心内容
- [ ] Fusion 扩展嵌入到相应语义节点
- [ ] `grep "REQUIRED SUB-SKILL" skills/` 返回 ≥5 个结果
- [ ] 工作流可从 brainstorming → writing-plans → executing-plans 自动调用
