# 设计文档：多语言测试报告器（方案 B：打包到主包）

## 架构概览

```text
┌─────────────────────────────────────────────────────────────────┐
│                    superpowers-fusion                           │
│                    (所有 reporters 打包在主包中)                  │
├─────────────────────────────────────────────────────────────────┤
│  lib/reporters/                                                 │
│  ├── vitest-reporter.ts  ✅ 已修复                              │
│  ├── jest-reporter.ts    📋 待复制                              │
│  └── python/pytest_reporter.py  📋 待复制                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                     .fusion/test-results.json
                              ↓
                     UnifiedTestReportSchema
```

## ✅ 兼容层状态：不需要

经代码搜索确认，所有代码都使用新格式 `report.summary.passed/failed`：
- `lib/test-status-checker.ts`
- `lib/pipeline.ts`
- `lib/schemas.ts`

之前只是 vitest-reporter 输出了错误格式，现已修复。

---

## 方案 B：打包到主包

### 安装流程

```bash
# 用户安装主包（包含所有 reporters）
npm install superpowers-fusion

# 自动检测语言并配置
npx superpowers-fusion install-reporter
```

### 自动检测逻辑

```typescript
// src/cli/install-reporter.ts
const stack = detectTechStack(projectDir);

switch (stack.language) {
    case "typescript":
    case "javascript":
        if (stack.testRunner === "vitest") {
            // 配置 vitest.config.ts
        } else if (stack.testRunner === "jest") {
            // 配置 jest.config.js
        }
        break;
    case "python":
        // 复制 pytest_reporter.py 到 .fusion/reporters/
        break;
    case "go":
        // 复制 go reporter
        break;
}
```

---

## 文件结构

```text
superpowers-fusion/
├── lib/
│   ├── vitest-reporter.ts     ← 保持原位置，已修复
│   └── reporters/
│       ├── jest-reporter.ts   ← 复制自 tdd-guard
│       ├── types.ts           ← 共享类型
│       └── python/
│           └── pytest_reporter.py  ← 复制自 tdd-guard
├── src/cli/
│   └── install-reporter.ts    ← 扩展支持多语言
└── lib/
    └── tech-detector.ts       ← 扩展语言检测
```

---

## 与原版 superpowers 调用顺序

```text
用户编辑请求
    ↓
┌───────────────────────────────────┐
│ superpowers-fusion                │
│   preToolEditWithPipeline()       │
│   ├── Step 1: Guard Toggle        │
│   ├── Step 2: Ignore Patterns     │
│   ├── Step 3: Risk Tier Check     │
│   ├── Step 4: Workflow Phase      │
│   ├── Step 5: Test Status         │  ← 读取 reporter 输出
│   ├── Step 6: AST Quality         │
│   └── Step 7: Lint Notification   │
└───────────────────────────────────┘
    ↓
允许/阻止编辑
```

---

## 关键保证

| 检查项 | 状态 |
|-------|------|
| `.fusion/test-results.json` 路径不变 | ✅ |
| `hooks/preToolEdit.ts` 入口不变 | ✅ |
| Pipeline 步骤顺序不变 | ✅ |
| vitest-reporter 输出新格式 | ✅ |
| 无需兼容层 | ✅ |
