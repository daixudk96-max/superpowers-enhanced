# Tasks: Restore Superpowers Canon (有机整合)

## Phase 1: 核心 Skills 有机整合

### 1.1 整合 test-driven-development SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [ ] 1.1.1 恢复 YAML frontmatter（name, description）
- [ ] 1.1.2 恢复 Graphviz 流程图（TDD cycle）
- [ ] 1.1.3 恢复 Good/Bad 代码示例
- [ ] 1.1.4 恢复"借口反驳表"（Excuse Busters）
- [ ] 1.1.5 恢复验证清单

**Fusion 扩展嵌入：**

- [ ] 1.1.6 将 Risk Tier 表格嵌入 "When to Use" 节
- [ ] 1.1.7 将 豁免流程 嵌入 Step 节点（非末尾）
- [ ] 1.1.8 将多语言支持表格嵌入 "Testing" 节

### 1.2 整合 brainstorming SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [ ] 1.2.1 恢复 YAML frontmatter
- [ ] 1.2.2 恢复渐进式验证流程
- [ ] 1.2.3 恢复 `superpowers:using-git-worktrees` 引用
- [ ] 1.2.4 恢复 `superpowers:writing-plans` 引用

**Fusion 扩展嵌入：**

- [ ] 1.2.5 将 Codex 协作嵌入 "Exploring approaches" 节
- [ ] 1.2.6 将 Options 表格格式嵌入 "Presenting the design" 节

### 1.3 整合 writing-plans SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [ ] 1.3.1 恢复 YAML frontmatter
- [ ] 1.3.2 恢复完整 Task Structure 模板
- [ ] 1.3.3 恢复 Execution Handoff 选项（Subagent vs Parallel）
- [ ] 1.3.4 恢复 `superpowers:executing-plans` 引用
- [ ] 1.3.5 恢复 `superpowers:subagent-driven-development` 引用

**Fusion 扩展嵌入：**

- [ ] 1.3.6 将 Risk Tier 标注嵌入 Task Structure 模板
- [ ] 1.3.7 将 Codex 协作嵌入 Plan Header 节
- [ ] 1.3.8 将 OpenSpec 输出路径嵌入 "Save plans to" 节

---

## Phase 2: 执行流程整合

### 2.1 整合 executing-plans SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [ ] 2.1.1 恢复 YAML frontmatter
- [ ] 2.1.2 恢复批量执行流程（5个步骤）
- [ ] 2.1.3 恢复 `superpowers:finishing-a-development-branch` 引用
- [ ] 2.1.4 恢复 "When to Stop and Ask for Help" 节

**Fusion 扩展嵌入：**

- [ ] 2.1.5 将 Codex prototype 嵌入 Step 2 前
- [ ] 2.1.6 将 Codex review 嵌入 Step 2 后
- [ ] 2.1.7 将 SHA 追踪嵌入 "Commit" 步骤
- [ ] 2.1.8 将 Archive trigger 嵌入 Step 5 后

### 2.2 验证 subagent-driven-development <!-- Risk: Tier-1 -->

- [ ] 2.2.1 确认已完整（299行含 Codex 扩展）
- [ ] 2.2.2 确认子技能引用存在

---

## Phase 3: 辅助 Skills 恢复

### 3.1 整合 using-superpowers SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [ ] 3.1.1 恢复 Graphviz 流程图（skill_flow）
- [ ] 3.1.2 恢复 "Red Flags" 标题（替代 "Rationalizations to Reject"）

**Fusion 新功能适配（嵌入）：**

- [ ] 3.1.3 在 "Skill Types" 节增加 Risk Tier 系统说明：
  ```
  **Risk-Tiered** (TDD enforcement): Tier 0-3 determines TDD strictness.
  ```
- [ ] 3.1.4 新增 "Codex Collaboration" 节：
  ```
  ## Codex Collaboration
  When implementing or reviewing, use Codex for:
  - Code prototypes (unified diff only)
  - Code review after implementation
  - Requirement analysis and edge case identification
  ```
- [ ] 3.1.5 新增 "Change Management" 节：
  ```
  ## Change Management (OpenSpec)
  Commands for structured change workflow:
  - `/new-change {id}` - Start new change with proposal
  - `/implement` - Execute tasks with TDD compliance
  - `/archive {id}` - Archive completed change
  - `/revert {id}` - Rollback change
  ```

### 3.2 验证其他 Skills <!-- Risk: Tier-0 -->


- [ ] 3.2.1 verification-before-completion
- [ ] 3.2.2 finishing-a-development-branch
- [ ] 3.2.3 requesting-code-review
- [ ] 3.2.4 receiving-code-review
- [ ] 3.2.5 using-git-worktrees

---

## Phase 4: 验证与收尾

### 4.1 引用链验证 <!-- Risk: Tier-0 -->

- [ ] 4.1.1 运行 `grep -r "REQUIRED SUB-SKILL" skills/` 应返回 ≥5 个结果
- [ ] 4.1.2 运行 `grep -r "superpowers:" skills/` 验证引用格式

### 4.2 工作流验证 <!-- Risk: Tier-0 -->

- [ ] 4.2.1 测试 /brainstorm → brainstorming skill
- [ ] 4.2.2 测试 brainstorming → writing-plans 引用
- [ ] 4.2.3 测试 writing-plans → executing-plans 引用
- [ ] 4.2.4 测试 executing-plans → finishing-a-development-branch 引用

### 4.3 归档 <!-- Risk: Tier-0 -->

- [ ] 4.3.1 运行 openspec validate
- [ ] 4.3.2 归档变更

---

## 验证命令

```bash
# 引用链完整性
grep -r "REQUIRED SUB-SKILL" skills/ | wc -l  # 应 ≥5

# Fusion 扩展嵌入
grep -l "Risk Tier" skills/*/SKILL.md  # 应包含 tdd, writing-plans

# 工作流连通性
grep "superpowers:" skills/brainstorming/SKILL.md    # using-git-worktrees, writing-plans
grep "superpowers:" skills/writing-plans/SKILL.md    # executing-plans, subagent
grep "superpowers:" skills/executing-plans/SKILL.md  # finishing-a-development-branch
```
