# Tasks: Restore Superpowers Canon (有机整合)

## Phase 1: Tier 1 Skills (核心技能，差异最大)

### 1.1 整合 test-driven-development SKILL.md <!-- Risk: Tier-2 -->

- [ ] 1.1.1 分析原版结构（372行）：识别 Purpose/Workflow/Examples/Anti-patterns 各节
- [ ] 1.1.2 分析 Fusion 版结构（68行）：识别 Risk Tier/多语言/豁免 各组件
- [ ] 1.1.3 将 Risk Tier 表格嵌入 "When to Use" 节
- [ ] 1.1.4 将豁免流程嵌入 Workflow 各步骤的控制节点
- [ ] 1.1.5 新增 "Collaboration & Governance" 节，融入 Codex 协作规范
- [ ] 1.1.6 恢复原版 Good/Bad 示例、借口反驳表、验证清单
- [ ] 1.1.7 恢复所有 REQUIRED SUB-SKILL 引用
- [ ] 1.1.8 复制 testing-anti-patterns.md 辅助文件

### 1.2 整合 brainstorming SKILL.md <!-- Risk: Tier-2 -->

- [ ] 1.2.1 恢复原版渐进式验证流程
- [ ] 1.2.2 恢复子技能引用：superpowers:using-git-worktrees, superpowers:writing-plans
- [ ] 1.2.3 将 Fusion 的 Options 表格格式嵌入 "Output Format" 节

### 1.3 整合 writing-plans SKILL.md <!-- Risk: Tier-2 -->

- [ ] 1.3.1 恢复执行交接选项（Subagent vs Parallel）
- [ ] 1.3.2 恢复完整 TDD 任务模板
- [ ] 1.3.3 将 Risk Tier 分配嵌入任务结构
- [ ] 1.3.4 将 Codex 协作嵌入 "Collaboration" 节
- [ ] 1.3.5 恢复子技能引用链

---

## Phase 2: Tier 2 Skills (重写或有子目录依赖)

### 2.1 整合 executing-plans SKILL.md <!-- Risk: Tier-2 -->

- [ ] 2.1.1 恢复原版批量执行流程
- [ ] 2.1.2 将 Fusion 的 Codex review 嵌入 "Post-batch" 节
- [ ] 2.1.3 将 SHA 追踪嵌入 "Commit" 步骤
- [ ] 2.1.4 恢复子技能引用：superpowers:finishing-a-development-branch

### 2.2 验证 subagent-driven-development <!-- Risk: Tier-1 -->

- [ ] 2.2.1 确认已有完整原版 + Codex 扩展（299行）
- [ ] 2.2.2 验证子目录 prompt 模板完整性

### 2.3 整合 systematic-debugging <!-- Risk: Tier-1 -->

- [ ] 2.3.1 恢复原版四阶段调试流程
- [ ] 2.3.2 将 Codex 协作嵌入各阶段
- [ ] 2.3.3 恢复辅助文件（condition-based-waiting.md 等）

---

## Phase 3: Tier 3 Skills (其他技能)

### 3.1 整合 using-superpowers SKILL.md <!-- Risk: Tier-1 -->

- [ ] 3.1.1 恢复完整流程图（Graphviz dot）
- [ ] 3.1.2 恢复完整 Red Flags 表格

### 3.2-3.8 其他 7 个 Skills <!-- Risk: Tier-0/1 -->

- [ ] 3.2 整合 verification-before-completion
- [ ] 3.3 整合 finishing-a-development-branch
- [ ] 3.4 整合 dispatching-parallel-agents
- [ ] 3.5 整合 requesting-code-review（含辅助文件）
- [ ] 3.6 整合 receiving-code-review
- [ ] 3.7 整合 using-git-worktrees
- [ ] 3.8 整合 writing-skills（含辅助文件和 examples/）

---

## Phase 4: 验证与收尾

### 4.1 全局验证 <!-- Risk: Tier-0 -->

- [ ] 4.1.1 运行 `grep -r "REQUIRED SUB-SKILL" skills/` 验证引用链
- [ ] 4.1.2 验证所有 SKILL.md 的 YAML frontmatter 格式
- [ ] 4.1.3 验证 Risk Tier 嵌入位置正确
- [ ] 4.1.4 验证 Codex 协作融入 Collaboration 节

### 4.2 归档 <!-- Risk: Tier-0 -->

- [ ] 4.2.1 更新 README.md
- [ ] 4.2.2 归档此变更

---

## 验证命令

```bash
# 检查子技能引用链
grep -r "REQUIRED SUB-SKILL" skills/

# 检查 Risk Tier 嵌入
grep -l "Risk Tier" skills/*/SKILL.md

# 检查 Codex 协作融入
grep -l "Codex" skills/*/SKILL.md
```
