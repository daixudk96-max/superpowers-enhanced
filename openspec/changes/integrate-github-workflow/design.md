# 架构设计：工作流闭环整合

## 设计目标

实现原版 superpowers 与 superpowers-fusion 的有机整合，遵循"保持原有功能 → 整合增量更新"原则。

## 架构决策

### 1. 迁移策略：复制 + 适配（非重写）

**理由**：
- 原版 `execute-plan.md` 仅 7 行，是纯技能调用
- fusion 已有相同格式的 `brainstorm.md` 和 `write-plan.md`
- 复制后无需修改，保持语义一致性

```
原版:  技能调用 → 调用 superpowers:executing-plans skill
Fusion: 技能调用 + TypeScript 扩展（状态追踪、TDD 门控）
```

### 2. 工作流阶段继承

```mermaid
graph LR
    A["/brainstorm"] -->|brainstorming| B["/write-plan"]
    B -->|writing-plans| C["/implement"]
    C -->|implement| D["/execute-plan"]
    D -->|executing-plans| E["/archive"]
    E -->|archive| F["完成"]
    
    style D fill:#f96,stroke:#333
```

`execute-plan.ts` 职责：
1. 调用 `WorkflowMiddleware.setPhase("executing-plans")`
2. 读取 `.fusion/status.json` 获取活动变更
3. 解析 `changes/<name>/tasks.md` 找到下一个 `- [ ]` 任务
4. 输出任务描述 + 调用技能提示

### 3. 命令调用链路

```
implement.ts:L116 → getCommandPrompt("execute-plan") 
                     ↓
                  查找 commands/execute-plan.md
                     ↓ (当前缺失，返回 null)
                  返回 undefined
                     ↓
implement.ts:L198 → 硬编码提示 "Use /execute-plan..."
```

补齐 `execute-plan.md` 后：
- `getCommandPrompt` 可正确返回技能调用提示
- 用户在 Claude 中调用 `/execute-plan` 时触发技能行为

### 4. TDD 强制策略

根据 `workflow-middleware.ts` 配置：

| 阶段 | TDD Required | Block on Failure | Min Tier |
|------|--------------|------------------|----------|
| `brainstorming` | ❌ | ❌ | 4 |
| `writing-plans` | ❌ | ❌ | 4 |
| `implement` | ✅ | ✅ | 2 |
| `executing-plans` | ✅ | ✅ | 2 |
| `archive` | ❌ | ❌ | 4 |

`execute-plan` 进入后自动启用 TDD 强制。

## 文件变更清单

```
superpowers-fusion/
├── commands/
│   ├── execute-plan.md   [NEW] ← 从原版复制
│   ├── execute-plan.ts   [NEW] ← 新增实现
│   └── index.ts          [MODIFY] ← 导出新命令
└── .github/
    └── FUNDING.yml       [NEW/可选] ← 根据用户决策
```

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 技能文件缺失导致调用失败 | 先验证 skills/executing-plans/ 存在 |
| TypeScript 编译错误 | 参考 implement.ts 已验证的模式 |
| 测试覆盖不足 | 现有 workflow-middleware.test.ts 已测试 executing-plans 阶段 |
