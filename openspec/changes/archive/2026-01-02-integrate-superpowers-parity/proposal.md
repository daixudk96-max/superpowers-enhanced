# 变更: integrate-superpowers-parity

> 确保 superpowers-fusion 实现与原始 superpowers 的完整功能对等，并增强 Codex 协作能力。

## 为什么

1. **功能缺口**: 缺少 `lib/skills-core.js`、SessionStart 钩子、部分技能
2. **自动化校验缺失**: 没有 `openspec validate` 命令
3. **Codex 协作未标准化**: 需要在关键技能中明确 Codex 协作点

## 变更内容

### 1. OpenSpec Validate 命令 (新建)
- 创建 `src/cli/openspec-validate.ts`
- 校验: 目录骨架、proposal/tasks 格式、spec delta 语法

### 2. 核心库补齐 (复制)
- **直接复制** `lib/skills-core.js`（无需转 TS）

### 3. 技能补齐与增强

#### 3.1 直接复制
- `skills/receiving-code-review/`
- 原版 `skills/subagent-driven-development/`（作为基础）

#### 3.2 增强 `systematic-debugging` (复制后修改)

在四阶段调试流程中添加 Codex 协作点：

| 阶段 | + Codex 集成 |
|------|--------------|
| **Phase 1: 根因调查** | **必须**: 初步分析后告知 Codex，要求完善根因假设 |
| **Phase 2: 模式分析** | 可选: 让 Codex 分析代码模式差异 |
| **Phase 3: 假设测试** | **必须**: 向 Codex 索要修复原型 (unified diff)，自己重写后实施 |
| **Phase 4: 实施修复** | **必须**: 修复后立即让 Codex review 代码改动 |

#### 3.3 增强 `subagent-driven-development` (复制原版后修改)

**保留原版流程**（Implementer → Spec Reviewer → Code Quality Reviewer），**用 Codex 辅助各阶段**：

| 原版步骤 | + Codex 辅助 |
|----------|--------------|
| Implementer 实现 | Codex 提供代码原型 (unified diff)，Implementer 参考重写 |
| Spec Reviewer 评审 | 可选: Codex 辅助检查 spec 符合度 |
| Code Quality Reviewer 评审 | **必须**: Codex review 代码质量 |
| 修复问题 | Codex 提供修复建议 |

**新增 Codex 协作规范**（嵌入技能文档）:
```
## Codex 协作规范

在任务执行中，必须遵循以下 Codex 协作步骤：

1. **需求分析后**: 将需求告知 Codex，要求完善实施计划
2. **编码前**: 向 Codex 索要代码原型 (unified diff)，以此为参考重写
3. **编码后**: 立即使用 Codex review 代码改动
4. **独立思考**: Codex 仅供参考，必须有自己的判断
```

### 4. SessionStart 钩子 (复制适配)
- 复制 `hooks/session-start.sh` 并适配路径

---

## 影响范围

- `src/cli/` - 新增 validate 命令
- `lib/` - 复制 skills-core.js
- `skills/systematic-debugging/` - 增强 Codex 集成
- `skills/subagent-driven-development/` - 恢复原流程 + Codex 辅助
- `skills/receiving-code-review/` - 直接复制
- `hooks/` - 复制 session-start

## 成功标准

- [ ] `openspec validate <id>` 正确校验
- [ ] 所有 14 个技能存在
- [ ] `systematic-debugging` 包含 Codex 协作点
- [ ] `subagent-driven-development` 保留原版三阶段评审 + Codex 辅助
