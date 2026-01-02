# 设计文档: restore-workflow-commands

## 架构决策

### ADR-1: 修改插件命令入口

**决定**: 将 `claude-plugin.json` 的 `entry_points.commands` 改为 `./commands` (Markdown 目录)
- TS CLI 保留为 `bin` 入口供人工调用
- 对于需要文件操作的命令，在 Markdown 中指示 Agent 调用对应 CLI

### ADR-2: 激活 AI 验证功能

**当前问题**: `validateWithAI()` 已实现但未被调用

**修改方案**: 在 `preToolEdit.ts` 的 Tier 2/3 阻止逻辑后添加 AI 验证 fallback

```typescript
// hooks/preToolEdit.ts (修改后)
if (blockResult.blocked) {
    // 新增: 在阻止前尝试 AI 验证
    if (config.tdd.client === "api" && hasApiKey(config)) {
        const aiResult = await validateWithAI({
            context: `Editing ${event.filePath} without failing test`,
            filePath: event.filePath,
            content: event.content ?? "",
        });
        if (aiResult.decision === "approve") {
            return { allowed: true, tier: tier.tier, reason: aiResult.reason };
        }
    }
    return { allowed: false, reason: blockResult.reason, tier: tier.tier };
}
```

### ADR-3: 激活 AST 检查功能

**当前问题**: `checkTestQuality()` 仅在编辑测试文件时触发

**修改方案**: 在编辑源代码时，查找对应测试文件并检查其质量

```typescript
// 新增: findCorrespondingTestFile() 工具函数
// src/utils/helper.ts -> src/utils/helper.test.ts
// src/api/user.ts -> src/api/user.test.ts 或 tests/api/user.test.ts
```

### ADR-4: 修复 Init 命令

**当前问题**: `init.ts` 只写入部分 TDD 配置

**修改方案**: 扩展 `requiredVars` 对象

```typescript
const requiredVars: {[key: string]: string} = {
    'TDD_VALIDATION_ENABLED': 'true',
    'TDD_VALIDATION_CLIENT': 'sdk',       // 新增
    'TDD_AST_CHECKS_ENABLED': 'true',
    'TDD_DEFAULT_TIER': '2',
    'TDD_REJECT_EMPTY_TESTS': 'true',     // 新增
    'TDD_REJECT_MISSING_ASSERTIONS': 'true', // 新增
    'TDD_REJECT_TRIVIAL_ASSERTIONS': 'true', // 新增
};
```

## 文件变更映射

```text
hooks/
├── preToolEdit.ts     🔧 添加 AI 验证和 AST 检查调用
└── postToolEdit.ts    (无变更，已正确实现)

lib/
├── api-client.ts      (无变更，已正确实现)
└── test-quality-checker.ts  (无变更，已正确实现)

src/cli/
└── init.ts            🔧 补全 .env 默认值写入

commands/
├── write-plan.md      ✨ 新增
├── archive.ts         🔧 扩展检查点功能
└── ...

.claude/rules/standard/
├── tdd-enforcement.md     ✨ 新增（从 claude-codepro 适配）
└── workflow-enforcement.md ✨ 新增（从 claude-codepro 适配）

scripts/
└── install-reporter.js    ✨ 新增
```

### ADR-5: 模块化规则系统适配

**来源**: claude-codepro `.claude/rules/standard/`

**适配要求**:

| 原始内容 | 适配后 |
| --- | --- |
| `/plan` 命令 | `/write-plan` |
| `/implement` 命令 | `/execute-plan` |
| `/verify` 命令 | 阶段检查点验证 |
| Plan-Implement-Verify 生命周期 | Brainstorm-WritePlan-Execute |

### ADR-6: 检查点机制

**来源**: conductor 的 Git Notes + Checkpoint Commit 模式

**实现方案**:

```typescript
// commands/archive.ts 扩展
export function attachGitNote(commitSha: string, summary: string): void {
    execSync(`git notes add -m "${summary}" ${commitSha}`);
}

export function createCheckpointCommit(phaseName: string): string {
    execSync('git add .');
    execSync(`git commit --allow-empty -m "checkpoint(${phaseName}): Phase complete"`);
    return execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
}
```

### ADR-7: Vitest Reporter 集成

**来源**: tdd-guard `reporters/vitest/src/VitestReporter.ts`

**适配要求**:

- 替换 `import { Storage, FileStorage, Config } from 'tdd-guard'` 为本地实现
- 适配 `.fusion/test-results.json` 输出路径

## 验证计划

### 自动化测试

```bash
# 运行现有单元测试
npm run test

# 预期: tests/hooks.test.ts 所有用例通过
```

### 手动验证

1. **命令引导测试**: 在 Claude Code 中执行 `/setup`，确认输出包含下一步指引
2. **AI 验证测试**: 设置 `TDD_VALIDATION_CLIENT=api` 和 API Key，尝试编辑 Tier 2 文件
3. **Init 测试**: 删除 `.env` 后运行 `superpowers-fusion init`，检查生成的配置
4. **规则加载测试**: 在 Claude Code 中执行 `/context`，确认 `.claude/rules/` 被加载
5. **检查点测试**: 执行 `/archive`，确认创建了 checkpoint commit 和 git note

