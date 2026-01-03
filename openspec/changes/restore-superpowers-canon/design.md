# Design: Restore Superpowers Canon (有机整合)

## 设计原则

### 有机整合 vs 简单追加

| 方面 | 简单追加（错误） | 有机整合（正确） |
| --- | --- | --- |
| 结构 | 原版 + "--- Fusion 扩展" | 融合成统一结构 |
| Risk Tier | 末尾独立章节 | 嵌入 "When to Use" |
| Codex 协作 | 末尾独立章节 | 嵌入 "Collaboration" |
| 豁免流程 | 末尾独立章节 | 嵌入 Workflow 步骤 |
| 阅读体验 | 割裂，需来回跳转 | 连贯，按需查阅 |

### 整合后的统一结构

```
1. Purpose (原版)
2. When to Use / Preconditions
   └── Risk Tier 表格 (Fusion 嵌入)
   └── 分层动作差异 (Fusion 嵌入)
3. Outcomes / Definition of Done
   └── 原版验证清单
   └── 风险层级追加检查项 (Fusion 嵌入)
4. Workflow
   └── 原版步骤
   └── 每步内嵌：Risk Tier 差异 + 豁免钩子 (Fusion)
   └── REQUIRED SUB-SKILL 引用 (原版恢复)
5. Examples (原版 Good/Bad + Fusion 多语言)
6. Anti-patterns & Excuse Busters (原版)
7. Collaboration & Governance
   └── Codex 协作规范 (Fusion 新增)
   └── OpenSpec 触发条件 (Fusion 新增)
8. Required Sub-skills (原版恢复 + Fusion 补充)
9. Checklists (原版 + Fusion 按层级追加)
10. Exemptions & Escalation (Fusion 新增)
```

## 决策记录

### DR-1: 为什么选择有机整合

**背景**: 用户明确要求"不是简单追加，要有机整合"

**决定**: 将 Fusion 扩展嵌入到原版结构的相应语义段落

**理由**:
1. 阅读体验：用户在阅读某节时能看到所有相关信息
2. 维护成本：修改某功能时只需编辑一处
3. 逻辑连贯：Risk Tier 就应该在 "When to Use" 而非末尾

### DR-2: 保留的 Fusion 扩展

| 扩展 | 保留 | 嵌入位置 |
| --- | --- | --- |
| Risk Tier 0-3 | ✅ | When to Use |
| Codex 协作规范 | ✅ | Collaboration |
| 豁免流程 | ✅ | Workflow 各步骤 |
| 多语言支持 | ✅ | Examples |
| OpenSpec 触发 | ✅ | Collaboration |
| Fusion 简化结构 | ❌ | 被原版结构替代 |

### DR-3: 子技能引用链处理

**原则**: 完整恢复原版引用 + 补充 Fusion 新引用

**恢复**:
- `REQUIRED SUB-SKILL: Use superpowers:test-driven-development`
- `REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch`
- 等

**补充**:
- Codex 协作调用（作为并列项而非替代）

## 回滚计划

```bash
git checkout HEAD~1 -- skills/
```
