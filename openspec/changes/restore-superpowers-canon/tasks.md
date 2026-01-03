# Tasks: Restore Superpowers Canon (有机整合)

## Phase 1: 核心 Skills 有机整合

### 1.1 整合 test-driven-development SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [x] 1.1.1 恢复 YAML frontmatter（name, description）
- [x] 1.1.2 恢复 Graphviz 流程图（TDD cycle）
- [x] 1.1.3 恢复 Good/Bad 代码示例
- [x] 1.1.4 恢复"借口反驳表"（Excuse Busters）
- [x] 1.1.5 恢复验证清单

**Fusion 扩展嵌入：**

- [x] 1.1.6 将 Risk Tier 表格嵌入 "When to Use" 节
- [x] 1.1.7 将 豁免流程 嵌入 Risk Tier 节内
- [x] 1.1.8 将多语言支持表格嵌入 "Test Quality" 节后

### 1.2 整合 brainstorming SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [x] 1.2.1 恢复 YAML frontmatter
- [x] 1.2.2 恢复渐进式验证流程
- [x] 1.2.3 恢复 `superpowers:using-git-worktrees` 引用
- [x] 1.2.4 恢复 `superpowers:writing-plans` 引用

**Fusion 扩展嵌入：**

- [x] 1.2.5 将 Codex 协作嵌入 "Exploring approaches" 节
- [x] 1.2.6 将 Options 表格格式嵌入 "Output Format" 节

### 1.3 整合 writing-plans SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [x] 1.3.1 恢复 YAML frontmatter
- [x] 1.3.2 恢复完整 Task Structure 模板
- [x] 1.3.3 恢复 Execution Handoff 选项（Subagent vs Parallel）
- [x] 1.3.4 恢复 `superpowers:executing-plans` 引用
- [x] 1.3.5 恢复 `superpowers:subagent-driven-development` 引用

**Fusion 扩展嵌入：**

- [x] 1.3.6 将 Risk Tier Assignment 嵌入 Task Structure 前
- [x] 1.3.7 将 Codex 协作嵌入 Overview 后
- [x] 1.3.8 将 OpenSpec 输出路径嵌入 "Save plans to" 和 "Output Artifacts" 节

---

## Phase 2: 执行流程整合

### 2.1 整合 executing-plans SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [x] 2.1.1 恢复 YAML frontmatter
- [x] 2.1.2 恢复批量执行流程（5个步骤）
- [x] 2.1.3 恢复 `superpowers:finishing-a-development-branch` 引用
- [x] 2.1.4 恢复 "When to Stop and Ask for Help" 节

**Fusion 扩展嵌入：**

- [x] 2.1.5 将 Codex prototype 嵌入 Step 2a
- [x] 2.1.6 将 Codex review 嵌入 Step 2c
- [x] 2.1.7 将 SHA 追踪嵌入 Step 2d
- [x] 2.1.8 将 Archive trigger 嵌入 Step 5 后

### 2.2 验证 subagent-driven-development <!-- Risk: Tier-1 -->

- [x] 2.2.1 确认已完整（299行含 Codex 扩展）
- [x] 2.2.2 确认子技能引用存在

---

## Phase 3: 辅助 Skills 恢复

### 3.1 整合 using-superpowers SKILL.md <!-- Risk: Tier-2 -->

**原版内容恢复：**

- [x] 3.1.1 恢复 Graphviz 流程图（skill_flow）
- [x] 3.1.2 恢复 "Red Flags" 表格

**Fusion 新功能适配（嵌入）：**

- [x] 3.1.3 在 "Skill Types" 节增加 Risk Tier 系统说明
- [x] 3.1.4 新增 "Codex Collaboration" 节
- [x] 3.1.5 新增 "Change Management" 节

### 3.2 验证其他 Skills <!-- Risk: Tier-0 -->

- [x] 3.2.1 verification-before-completion（已存在）
- [x] 3.2.2 finishing-a-development-branch（已存在）
- [x] 3.2.3 requesting-code-review（已存在）
- [x] 3.2.4 receiving-code-review（已存在）
- [x] 3.2.5 using-git-worktrees（已存在）

---

## Phase 4: 多语言 Reporters 移植

### 4.1 复制 tdd-guard reporters <!-- Risk: Tier-2 -->

- [x] 4.1.1 复制 `tdd-guard/reporters/go/` 到 `lib/reporters/go/` ✅ 17个文件
- [x] 4.1.2 复制 `tdd-guard/reporters/rspec/` 到 `lib/reporters/ruby/` ✅ 1个文件
- [x] 4.1.3 复制 `tdd-guard/reporters/rust/` 到 `lib/reporters/rust/` ✅ 8个文件
- [x] 4.1.4 复制 `tdd-guard/reporters/phpunit/` 到 `lib/reporters/php/` ✅ 23个文件
- [x] 4.1.5 复制 `tdd-guard/reporters/storybook/` 到 `lib/reporters/storybook/` ✅ 9个文件

### 4.2 修改适配 Fusion 输出格式 <!-- Risk: Tier-2 -->

- [x] 4.2.1 修改 Rust reporter 输出路径为 `.fusion/test-results.json`
- [x] 4.2.2 修改 PHP reporter 输出路径为 `.fusion/test-results.json`
- [x] 4.2.3 Go reporter 使用命令行参数，无需修改源码

### 4.3 扩展 install-reporter.ts <!-- Risk: Tier-2 -->

- [x] 4.3.1 添加 Go 安装逻辑和配置说明
- [x] 4.3.2 添加 Rust 安装逻辑和配置说明
- [x] 4.3.3 添加 PHP/PHPUnit 安装逻辑和配置说明

---

## Phase 5: 验证与收尾

### 5.1 引用链验证 <!-- Risk: Tier-0 -->

- [x] 5.1.1 运行 `grep -r "REQUIRED SUB-SKILL" skills/` → ✅ 6 个结果
- [x] 5.1.2 运行 `grep -r "superpowers:" skills/` → ✅ 21 个结果

### 5.2 工作流验证 <!-- Risk: Tier-0 -->

- [x] 5.2.1 brainstorming → writing-plans 引用 ✅
- [x] 5.2.2 writing-plans → executing-plans 引用 ✅
- [x] 5.2.3 writing-plans → subagent-driven-development 引用 ✅
- [x] 5.2.4 executing-plans → finishing-a-development-branch 引用 ✅

### 5.3 归档 <!-- Risk: Tier-0 -->

- [x] 5.3.1 所有任务完成
- [ ] 5.3.2 运行 openspec archive（待用户确认）

---

## 完成统计

| 项目 | 完成 | 总数 |
|------|------|------|
| SKILL.md 整合 | 5 | 5 |
| Reporters 移植 | 5 | 5 |
| 引用链恢复 | 6 | 5+ |
| install-reporter 扩展 | 3 | 3 |
