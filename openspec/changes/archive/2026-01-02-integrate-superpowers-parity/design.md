# 设计: integrate-superpowers-parity

## 概述

本文档记录了将完整 superpowers 功能集成到 superpowers-fusion 中的架构决策。

## 架构决策

### 1. `openspec validate` 实现

**选择**: TypeScript CLI 子命令，位于 `src/cli/openspec-validate.ts`

**理由**:
- 与现有 CLI 架构一致（`init`、`verify-tdd`、`install-reporter`）
- 类型安全的校验规则
- 可复用的校验函数（可用于 pre-commit 钩子等）

**校验层级**:
```
┌─────────────────────────────────────────────────────────┐
│                    CLI 接口                              │
│  openspec validate <id> [--strict] [--json]              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 骨架校验器                               │
│  • changes/<id>/ 存在                                    │
│  • proposal.md 存在                                      │
│  • tasks.md 存在                                         │
│  • specs/ 目录结构                                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 格式校验器                               │
│  • ProposalValidator（为什么/变更内容/影响范围）         │
│  • TasksValidator（复选框、风险层级）                    │
│  • SpecDeltaValidator（ADDED/MODIFIED/REMOVED 语法）     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              语义校验器 (--strict)                       │
│  • MODIFIED/REMOVED 引用现有需求                         │
│  • ADDED 不与现有需求冲突                                │
│  • 跨能力依赖已解决                                      │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Claude 插件集成

**选择**: 创建 `.claude-plugin/` 目录，使用独立的 TS 编译钩子

**理由**:
- Claude Code 期望在根目录找到 `.claude-plugin/plugin.json`
- 钩子应使用编译后的 TS 以兼容 Windows
- Shell 包装器仅用于跨平台入口点

**插件结构**:
```
.claude-plugin/
├── plugin.json          # 插件清单（与 claude-plugin.json 同步）
├── marketplace.json     # 市场元数据
└── hooks/
    └── hooks.json       # 钩子注册，指向 dist/hooks/*.js
```

**钩子流程**:
```
Claude Code SessionStart
        │
        ▼
.claude-plugin/hooks/hooks.json
        │
        ▼
hooks/session-start.sh（跨平台包装器）
        │
        ▼
node dist/hooks/sessionStart.js
        │
        ▼
将 using-superpowers 内容注入到 additionalContext
```

---

### 3. skills-core 架构

**选择**: 移植为 TypeScript，使用 ESM 导出

**理由**:
- 类型安全
- 与 fusion 代码库一致
- 可被 `.opencode` 插件和 `.codex` 脚本同时导入

**API 接口**:
```typescript
// lib/skills-core.ts
export function extractFrontmatter(filePath: string): { name: string; description: string };
export function findSkillsInDir(dir: string, sourceType: string, maxDepth?: number): SkillInfo[];
export function resolveSkillPath(skillName: string, superpowersDir: string, personalDir: string): SkillResolution | null;
export function stripFrontmatter(content: string): string;
export function checkForUpdates(repoDir: string): boolean;
```

---

### 4. 钩子架构统一

**当前状态**:
- `hooks/preToolEdit.ts` - TDD 校验（存在，正常工作）
- `hooks/postToolEdit.ts` - 编辑后操作（存在）
- `hooks/sessionHandler.ts` - 状态管理（存在）
- 缺失: 用于 bootstrap 的 SessionStart 钩子

**决策**: 添加 `sessionStart.ts`，不修改现有钩子

**注册配置**:
```json
// .claude-plugin/hooks/hooks.json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup|resume|clear|compact",
      "hooks": [{
        "type": "command",
        "command": "node dist/hooks/sessionStart.js"
      }]
    }],
    "PreToolUse": [...现有配置...]
  }
}
```

---

## 取舍分析

| 决策 | 优势 | 劣势 |
|------|------|------|
| skills-core 使用 TS | 类型安全、一致性 | 需要编译步骤 |
| 独立 .claude-plugin | 清晰分离 | 可能与 claude-plugin.json 同步问题 |
| Shell 包装器用于钩子 | 跨平台兼容 | 额外的间接层 |
| 单一 validate 命令 | 简单的 CLI | 后续可能需要子命令 |

## 安全考虑

- 校验器默认以只读模式运行
- 校验过程中无外部网络调用
- 文件路径在访问前进行清理
