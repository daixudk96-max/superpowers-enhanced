# Design: TDD Feature Migration Architecture (Complete with Pipeline)

## 1. PreToolEdit Pipeline Architecture

### 管线模块接口

```typescript
// lib/pipeline/types.ts

export interface PipelineContext {
  filePath: string;
  content?: string;
  event: PreToolEditEvent;
  session?: SessionRecord;
  workflowPhase?: 'brainstorm' | 'plan' | 'implement' | 'verify' | 'archive';
}

export interface PipelineResult {
  allowed: boolean;
  reason?: string;
  tier?: number;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface PipelineStep {
  name: string;
  execute(ctx: PipelineContext): Promise<PipelineResult | null>;
  // null = 继续下一步，PipelineResult = 终止管线
}
```

### 管线实现

```typescript
// lib/pipeline/preToolEditPipeline.ts

import { GuardManager } from '../guard-manager.js';
import { determineRiskTier } from '../risk-validator.js';
import { checkTestStatus } from '../test-status-checker.js';
import { checkTestQuality } from '../test-quality-checker.js';
import { checkLintNotification } from '../lint-notifier.js';

const pipeline: PipelineStep[] = [
  // Step 1: Guard Toggle Check [tdd-guard 原有]
  {
    name: 'guardToggle',
    async execute(ctx) {
      const guard = new GuardManager();
      if (!await guard.isEnabled()) {
        return { allowed: true, reason: 'TDD Guard disabled' };
      }
      return null; // 继续
    }
  },
  
  // Step 2: Ignore Patterns [tdd-guard 原有]
  {
    name: 'ignorePatterns',
    async execute(ctx) {
      const guard = new GuardManager();
      if (await guard.shouldIgnoreFile(ctx.filePath)) {
        return { allowed: true, reason: 'File matches ignore pattern' };
      }
      return null;
    }
  },
  
  // Step 3: Risk Tier [Fusion 增强]
  {
    name: 'riskTier',
    async execute(ctx) {
      const tier = determineRiskTier(ctx.filePath);
      ctx.metadata = { ...ctx.metadata, tier: tier.tier };
      
      if (tier.tier === 0) {
        return { allowed: true, tier: 0, reason: 'Tier 0: no enforcement' };
      }
      if (tier.tier === 1) {
        console.log(`[TDD] Tier 1 edit logged: ${ctx.filePath}`);
        return { allowed: true, tier: 1, reason: 'Tier 1: logged only' };
      }
      return null; // Tier 2-3 继续检查
    }
  },
  
  // Step 4: Test Status Check [tdd-guard 原有]
  {
    name: 'testStatus',
    async execute(ctx) {
      // 检查工作流阶段，brainstorm/plan 不阻断
      if (['brainstorm', 'plan'].includes(ctx.workflowPhase ?? '')) {
        return null;
      }
      
      const result = await checkTestStatus(ctx.filePath);
      if (result.blocked) {
        return { allowed: false, reason: result.reason };
      }
      return null;
    }
  },
  
  // Step 5: AST Quality Check [Fusion 增强]
  {
    name: 'astQuality',
    async execute(ctx) {
      const tier = ctx.metadata?.tier as number;
      if (tier < 2) return null; // 仅对 Tier 2-3 执行
      
      const quality = await checkTestQuality(ctx.filePath, ctx.content);
      if (!quality.ok) {
        return {
          allowed: true, // 不阻断，仅警告
          warnings: quality.errors,
        };
      }
      return null;
    }
  },
  
  // Step 6: Lint Notification [tdd-guard 原有]
  {
    name: 'lintNotification',
    async execute(ctx) {
      const result = await checkLintNotification(ctx.filePath);
      if (result.shouldBlock) {
        return { allowed: false, reason: result.reason };
      }
      if (result.shouldNotify) {
        console.warn(`[TDD] Lint issues pending: ${result.message}`);
      }
      return null;
    }
  },
];

export async function runPreToolEditPipeline(
  ctx: PipelineContext
): Promise<PipelineResult> {
  for (const step of pipeline) {
    const result = await step.execute(ctx);
    if (result !== null) {
      return result;
    }
  }
  return { allowed: true };
}
```

---

## 2. PostToolEdit Pipeline Architecture

```typescript
// lib/pipeline/postToolEditPipeline.ts

import { runESLint } from '../eslint-runner.js';
import { recordTaskCompletion } from '../task-recorder.js';
import { updateSession } from '../hooks/sessionHandler.js';

export async function runPostToolEditPipeline(
  filePath: string,
  content: string
): Promise<void> {
  const results: Record<string, unknown> = {};
  
  // Step 1: ESLint [tdd-guard 原有]
  try {
    const lintResult = await runESLint([filePath]);
    results.lint = lintResult;
    
    if (lintResult.errorCount > 0) {
      const config = loadConfig();
      if (config.tdd.lintBlock) {
        throw new Error(`Lint errors: ${lintResult.errorCount}`);
      }
      console.warn(`[TDD] Lint warnings: ${lintResult.warningCount} warnings, ${lintResult.errorCount} errors`);
    }
  } catch (error) {
    results.lintError = (error as Error).message;
    // 不抛出，继续执行
  }
  
  // Step 2: Record Task Completion [Fusion 现有]
  try {
    await recordTaskCompletion({
      filePath,
      timestamp: new Date().toISOString(),
      lintStatus: results.lint,
    });
  } finally {
    // Step 3: Update Session [Fusion 现有]
    await updateSession({
      lastEditedFile: filePath,
      lastEditTimestamp: new Date().toISOString(),
    });
  }
}
```

---

## 3. Workflow Middleware Integration

```typescript
// lib/workflow-middleware.ts

import { loadSession, saveSession } from '../hooks/sessionHandler.js';

export type WorkflowPhase = 'brainstorm' | 'plan' | 'implement' | 'verify' | 'archive';

interface WorkflowContext {
  phase: WorkflowPhase;
  tddRequired: boolean;
  startedAt: string;
}

const PHASE_CONFIG: Record<WorkflowPhase, { tddRequired: boolean }> = {
  brainstorm: { tddRequired: false },
  plan: { tddRequired: false },
  implement: { tddRequired: true },
  verify: { tddRequired: true },
  archive: { tddRequired: false },
};

export async function enterWorkflowPhase(phase: WorkflowPhase): Promise<void> {
  const session = await loadSession();
  const context: WorkflowContext = {
    phase,
    tddRequired: PHASE_CONFIG[phase].tddRequired,
    startedAt: new Date().toISOString(),
  };
  
  await saveSession({
    ...session,
    workflowContext: context,
  });
  
  console.log(`[Workflow] Entered phase: ${phase} (TDD: ${context.tddRequired ? 'ON' : 'OFF'})`);
}

export async function getCurrentWorkflowPhase(): Promise<WorkflowPhase | undefined> {
  const session = await loadSession();
  return session?.workflowContext?.phase;
}

export async function shouldEnforceTDD(): Promise<boolean> {
  const session = await loadSession();
  return session?.workflowContext?.tddRequired ?? true;
}
```

---

## 4. Command Integration Points

### 各命令入口调用 enterWorkflowPhase

```typescript
// commands/implement.ts (示例)
import { enterWorkflowPhase } from '../lib/workflow-middleware.js';

export async function implement(...): Promise<...> {
  // 进入 implement 阶段，启用 TDD 检查
  await enterWorkflowPhase('implement');
  
  // ... 原有实现逻辑
}

// commands/brainstorm.ts (示例)
export async function brainstorm(...): Promise<...> {
  // 进入 brainstorm 阶段，关闭 TDD 检查
  await enterWorkflowPhase('brainstorm');
  
  // ... 原有实现逻辑
}
```

---

## 5. Interface Adaptations (保留之前的)

### Hook 输入格式
| 原始 | 目标 |
|------|------|
| `hookData: string` | `event: PreToolEditEvent` |

### 配置读取
| 原始 | 目标 |
|------|------|
| `new Config()` | `loadConfig()` |

### 路径常量
| 原始 | 目标 |
|------|------|
| `.claude/tdd-guard/data/` | `.fusion/` |

---

## 6. Dependency Adaptations (保留之前的)

- **zod**: 用于 Schema 验证
- **minimatch**: 用于 ignore patterns

---

## 7. Storage Layer (保留之前的)

```typescript
export interface Storage {
  saveTest(content: string): Promise<void>;
  getTest(): Promise<string | null>;
  saveLint(content: string): Promise<void>;
  getLint(): Promise<string | null>;
  saveConfig(content: string): Promise<void>;
  getConfig(): Promise<string | null>;
  clearTransientData(): Promise<void>;
}
```

---

## 8. User Command Entry (保留之前的 CLI + 对话双入口)

```
CLI: superpowers-fusion tdd-toggle on|off|status
对话: "tdd on" / "tdd off"
```
