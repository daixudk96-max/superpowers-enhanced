# Proposal: Migrate TDD-Guard Features (Complete with Workflow Integration)

## Overview
完整保留 `tdd-guard` 原有功能，再整合增加 `superpowers-fusion` 现有的不同和扩展更新。确保与原版 `superpowers` 工作流自动调用。

---

## 重叠分析

### 功能重叠矩阵

| 功能 | tdd-guard | superpowers-fusion | 合并策略 |
|------|-----------|---------------------|----------|
| PreToolEdit | processHookData (204行) | preToolEdit.ts (165行) | **管线化合并** |
| PostToolEdit | postToolLint (165行) | postToolEdit.ts (已有) | **顺序调用** |
| Session Handler | sessionHandler.ts | sessionHandler.ts | **扩展现有** |
| TDD Skill 文档 | 隐式(hooks强制) | SKILL.md (68行) | **补充完整** |
| Risk Tiers | 无 | risk-validator.ts (125行) | **保留增强** |
| AST Test Quality | 无 | test-quality-checker.ts (214行) | **保留增强** |
| 多 Provider API | 3种 | 4种 | **保留增强** |
| Guard Toggle | GuardManager (84行) | 无 | **新增移植** |
| User Commands | userPromptHandler (55行) | 无 | **新增移植** |
| ESLint Runner | ESLint.ts (83行) | 无 | **新增移植** |
| Storage | FileStorage (109行) | 分散实现 | **统一抽象** |

---

## 流程适配：管线架构

### PreToolEdit 管线（保留原有 + 整合增强）

```
文件编辑请求
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│           PreToolEdit Pipeline (按顺序执行)                  │
├─────────────────────────────────────────────────────────────┤
│ 1. guardManager.isEnabled()                                 │
│    └── 如果 disabled，直接通过                              │
│                                                             │
│ 2. guardManager.shouldIgnoreFile()        [tdd-guard 原有]  │
│    └── 忽略 *.md, *.json, *.yml 等                         │
│                                                             │
│ 3. riskValidator.determineRiskTier()      [Fusion 增强]     │
│    └── Tier 0: 直接通过                                     │
│    └── Tier 1: 记录并通过                                   │
│    └── Tier 2-3: 继续检查                                   │
│                                                             │
│ 4. tddGuard.checkTestStatus()             [tdd-guard 原有]  │
│    └── 读取 .fusion/test-results.json                       │
│    └── 无失败测试则阻断 (Tier 3)                            │
│    └── 无测试文件则阻断 (Tier 2-3)                          │
│                                                             │
│ 5. astQuality.checkTestQuality()          [Fusion 增强]     │
│    └── 仅对 Tier 2-3 执行                                   │
│    └── 检测空测试、缺失断言                                  │
│                                                             │
│ 6. lintNotifier.checkPendingLintIssues()  [tdd-guard 原有]  │
│    └── 如果测试通过但有 lint 问题，提示修复                  │
│    └── 首次提示不阻断，已提示过则阻断                        │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
   允许/阻断
```

### PostToolEdit 管线（保留原有 + 整合增强）

```
文件编辑完成
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│           PostToolEdit Pipeline (按顺序执行)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. eslintRunner.run()                     [tdd-guard 原有]  │
│    └── 运行 ESLint 检查                                     │
│    └── 保存结果到 .fusion/lint-results.json                 │
│    └── 阻断或警告（根据 TDD_LINT_BLOCK 配置）                │
│                                                             │
│ 2. recordTaskCompletion()                 [Fusion 现有]     │
│    └── try/finally 确保即使 lint 失败也记录                  │
│    └── 写入 risk tier + test status + lint status          │
│                                                             │
│ 3. sessionHandler.updateSession()         [Fusion 现有]     │
│    └── 更新会话状态                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 工作流整合：与 superpowers 自动调用

### 原版 superpowers 命令

```
superpowers/commands/
├── brainstorm.md      → 头脑风暴，不阻断 TDD
├── execute-plan.md    → 执行计划，触发 TDD 检查
└── write-plan.md      → 编写计划，不阻断 TDD
```

### Fusion 命令与 TDD 整合

```
superpowers-fusion/commands/ 及 skills/
├── setup.ts                      → TDD：关闭
├── new-change.ts                 → TDD：关闭
├── brainstorming/                → TDD：关闭（探索阶段）
├── writing-plans/                → TDD：关闭（规划阶段）
├── implement.ts                  → TDD：强制 ✅
├── executing-plans/              → TDD：强制 ✅ (SKILL.md 第17行明确要求)
├── subagent-driven-development/  → TDD：强制 ✅
├── dispatching-parallel-agents/  → TDD：强制 ✅ (并行修复也要遵守)
├── systematic-debugging/         → TDD：强制 ✅ (先写失败测试再修复)
├── verification-before-completion/ → TDD：仅验证（不阻断但记录）
├── finishing-a-development-branch/ → TDD：仅验证
├── archive.ts                    → TDD：仅记录
├── revert.ts                     → TDD：关闭
└── status.ts                     → TDD：关闭
```

### 集成方案：中间件模式

```typescript
// lib/workflow-middleware.ts

interface WorkflowContext {
  phase: 'brainstorm' | 'plan' | 'implement' | 'verify' | 'archive';
  riskTier: number;
  tddRequired: boolean;
}

// 在各 command 的入口处调用
export function enterWorkflowPhase(phase: string): void {
  const context: WorkflowContext = {
    phase,
    riskTier: getCurrentRiskTier(),
    tddRequired: phase === 'implement' || phase === 'verify',
  };
  
  // 设置到 session，让 hooks 读取
  saveSession({
    ...loadSession(),
    workflowContext: context,
  });
}

// PreToolEdit 根据 workflowContext 决定检查强度
export function shouldEnforceTDD(): boolean {
  const session = loadSession();
  return session?.workflowContext?.tddRequired ?? true;
}
```

### 命令调用顺序（与原版 superpowers 一致）

```
用户开始任务
      │
      ▼
  /brainstorm        → 调用 TDD Skill 文档，但不阻断
      │
      ▼
  /write-plan        → 生成计划，不阻断
      │
      ▼
  /execute-plan      → 执行计划
      │
      ├─── 写测试时：允许编辑（测试文件）
      │
      └─── 写实现时：
             │
             ▼
        PreToolEdit Pipeline → 检查是否有失败测试
             │
             ▼
        如有失败测试 → 允许编辑
        如无失败测试 → 阻断，提示"请先写测试"
```

---

## 优先级策略

### Phase 0: 基础设施
添加依赖、创建 Storage 抽象、扩展配置

### Phase 1: 完整移植 tdd-guard（先锁定功能不丢）
1. 移植 GuardManager（enable/disable + ignore patterns）
2. 移植 ESLint Runner
3. 移植 postToolLint 逻辑（合并到 postToolEdit.ts）
4. 移植 userPromptHandler（对话命令）
5. **验证：对照矩阵确保与原版行为一致**

### Phase 2: 整合 Fusion 增强（按风险层级启用）
1. 将 Risk Tier 检查插入 PreToolEdit 管线开头
2. 将 AST Quality 检查插入 PreToolEdit 管线（仅 Tier 2-3）
3. 默认中高风险开启增强，低风险仅记录
4. **验证：确保旧行为无回归**

### Phase 3: 工作流整合
1. 创建 workflow-middleware.ts
2. 在各 command 中调用 enterWorkflowPhase()
3. PreToolEdit 读取 workflowContext 决定检查强度
4. 补充 TDD Skill 文档到 372 行完整版

### Phase 4: 验证与文档
添加测试、更新文档

---

## 验证矩阵

| 场景 | Risk | 测试变更 | Lint | 预期行为 |
|------|------|----------|------|----------|
| 低风险文件 | 0 | N/A | N/A | 直接通过 |
| 中风险无测试 | 2 | 无 | N/A | 阻断 |
| 中风险有测试 | 2 | 有 | Pass | 通过 |
| 高风险无失败测试 | 3 | 有但通过 | N/A | 阻断 |
| 高风险有失败测试 | 3 | 有且失败 | N/A | 通过 |
| 测试通过 + Lint 失败 | 2+ | 通过 | Fail | 首次警告，再次阻断 |
| brainstorm 阶段 | N/A | N/A | N/A | 不阻断 |
| implement 阶段 | 按实际 | 按实际 | 按实际 | 正常检查 |

---

## 配置开关

```bash
# .env

# 基础 TDD 开关
TDD_VALIDATION_ENABLED=true

# 增强功能开关（可独立关闭）
TDD_RISK_TIER_ENABLED=true
TDD_AST_QUALITY_ENABLED=true
TDD_LINT_ENABLED=true
TDD_LINT_BLOCK=false  # 首次仅警告

# 风险阈值（Tier 2+ 才强制检查）
TDD_MIN_ENFORCE_TIER=2
```

---

## Success Criteria

1. ✅ tdd-guard 所有原有功能保留（enable/disable、ignore、lint、测试状态检查）
2. ✅ Fusion 增强功能整合（Risk Tier、AST Quality、多 Provider）
3. ✅ 与 superpowers 工作流自动调用（brainstorm、execute-plan 等）
4. ✅ 验证矩阵全部通过
5. ✅ 配置开关可独立控制各增强项
