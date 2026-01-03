# 变更: restore-superpowers-canon

> 恢复原版 `obra/superpowers` 项目的完整 Skills 功能，采用有机整合方式融入 Fusion 扩展（Risk Tier、Codex 协作）。

## 为什么

1. **核心技能内容大幅简化**：
   - `test-driven-development`: 原版 372 行 → Fusion 68 行（丢失详细示例、流程图、哲学论证）
   - `brainstorming`: 原版 55 行 → Fusion 40 行（丢失渐进式验证流程）
   - `writing-plans`: 原版 117 行 → Fusion 63 行（丢失执行交接选项）

2. **工作流调用链断裂**：
   - 原版有子技能引用：`REQUIRED SUB-SKILL: Use superpowers:xxx`
   - Fusion 简化版缺失这些引用

3. **缺失关键内容**：流程图、Good/Bad 示例、借口反驳表、验证清单

## 变更内容

### 整合策略：有机融合（非简单追加）

采用 **嵌入式融合** 策略，将 Fusion 扩展融入原版结构的相应语义段落：

| Fusion 扩展 | 融入位置 | 融入方式 |
| --- | --- | --- |
| Risk Tier 0-3 | "When to Use" 节 | 提供分层策略与行动差异 |
| Codex 协作规范 | "Collaboration" 节 | 与子技能调用并列 |
| 豁免流程 | "Workflow" 各步骤内 | 嵌入流程控制节点 |
| 多语言支持 | "Examples" 节 | 追加语言示例 |
| OpenSpec 触发 | "Collaboration" 节 | 注明何时起 proposal |

### 整合后的 SKILL.md 结构

整合后每个 SKILL.md 按以下节点组织：

1. Purpose (原版)
2. When to Use + Risk Tier (原版 + Fusion 嵌入)
3. Outcomes / Definition of Done (原版 + Fusion 层级检查)
4. Workflow + 豁免钩子 (原版 + Fusion 嵌入)
5. Examples (原版 + Fusion 多语言)
6. Anti-patterns (原版)
7. Collaboration + Codex 协作 (新增节，Fusion)
8. Required Sub-skills (原版恢复 + Fusion 补充)
9. Checklists (原版 + Fusion 层级)

## 影响范围

### 受影响文件

| 目录 | 变更类型 | 数量 |
| --- | --- | --- |
| skills/*/SKILL.md | 有机整合 | 14 个 |
| skills/*/辅助文件 | 恢复原版 | ~15 个 |

### 风险评估

- **低风险**: Markdown 文档更新，不涉及运行时代码
- **保留 Fusion 功能**: Risk Tier、Codex 协作完整保留
- **恢复原版功能**: 详细示例、流程图、子技能链

## 成功标准

- [ ] 每个 SKILL.md 包含原版核心内容（流程、示例、清单）
- [ ] Risk Tier 嵌入 "When to Use" 节
- [ ] Codex 协作嵌入 "Collaboration" 节
- [ ] 子技能引用链完整
- [ ] YAML frontmatter 格式正确
