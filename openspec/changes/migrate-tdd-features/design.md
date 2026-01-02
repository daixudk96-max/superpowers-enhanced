# Design: TDD Feature Migration Architecture

## 1. Unified Test Result Schema

### Current State
- `FusionVitestReporter` outputs to `.fusion/test-results.json`:
```json
{
  "timestamp": "ISO8601",
  "duration": number,
  "passed": number,
  "failed": number,
  "skipped": number,
  "tests": [{ "name", "status", "duration", "error?" }]
}
```

- `tdd-guard` reporters output richer structure:
```json
{
  "testModules": [{ "moduleId", "tests": [...] }],
  "unhandledErrors": [...],
  "reason": "passed|failed|interrupted"
}
```

### Proposed Unified Schema
采用 Fusion 的扁平化结构，但扩展字段以支持更丰富的错误信息：

```typescript
interface UnifiedTestReport {
  timestamp: string;
  duration: number;
  summary: {
    passed: number;
    failed: number;
    skipped: number;
  };
  reason: 'passed' | 'failed' | 'interrupted' | 'unknown';
  tests: UnifiedTestResult[];
  unhandledErrors?: UnhandledError[];
}

interface UnifiedTestResult {
  name: string;
  fullName?: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: {
    message: string;
    expected?: string;
    actual?: string;
    stack?: string;
  };
}
```

## 2. ESLint Integration Architecture

### File Changes
- **NEW**: `lib/eslint-runner.ts` - 复制 `tdd-guard/src/linters/eslint/ESLint.ts` 核心逻辑
- **MODIFY**: `hooks/postToolEdit.ts` - 添加 lint 检查入口

### Data Flow
```
File Edit → postToolEdit.ts → [Risk Tier Check] → [Test Check]
                                  ↓ (if passed)
                              eslint-runner.ts
                                  ↓
                            .fusion/lint.json
                                  ↓
                           Console Warning / Block
```

### Configuration
在 `.env` 中添加：
```bash
TDD_LINTER_TYPE=eslint     # 'eslint' | 'none' (default: none)
TDD_LINT_ON_GREEN=true     # Run lint when tests pass (default: false)
TDD_LINT_BLOCK=false       # Block on lint errors (default: false, warn only)
```

## 3. Language Adapter Extension

### Current Support
`language-adapter.ts` 已支持：
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx, .mjs, .cjs)
- Python (.py)
- Go (.go)
- Rust (.rs)

### Additions
```typescript
const LANGUAGE_PATTERNS: Record<SupportedLanguage, TestFilePattern> = {
  // ... existing ...
  php: {
    extension: [".php"],
    testPatterns: [/Test\.php$/, /_test\.php$/, /tests\/.*\.php$/],
    assertionPatterns: [/\$this->assert/, /PHPUnit\\\/, /expectException/],
  },
  storybook: {
    extension: [".stories.tsx", ".stories.ts", ".stories.jsx", ".stories.js"],
    testPatterns: [/\.stories\.(tsx?|jsx?)$/],  // Stories ARE the tests
    assertionPatterns: [/expect\(/, /userEvent\./, /within\(/],
  },
};
```

### AST Check Bypass
对于 PHP，跳过 AST 检查，仅使用正则：
```typescript
function checkTestQuality(...) {
  const lang = detectLanguage(filePath);
  if (lang === "php" || lang === "storybook") {
    return checkTestQualityRegex(content, lang, options); // Skip AST
  }
  // ... existing AST logic for JS/TS
}
```

## 4. TDD Toggle Command

### Implementation
新增 CLI 子命令 `src/cli/tdd-toggle.ts`:

```typescript
// superpowers-fusion tdd-toggle on|off|status
export function tddToggleCommand(args: string[]): void {
  const action = args[0]; // 'on' | 'off' | 'status'
  const configPath = path.join(process.cwd(), '.fusion', 'config.json');
  
  // Read/update config.json with tddEnabled flag
  // This overrides TDD_VALIDATION_ENABLED in .env
}
```

### State Priority
1. `.fusion/config.json` (runtime override, highest)
2. `.env` (project config)
3. Default: `true`

## 5. Risk Assessment

| Risk | Mitigation |
|------|------------|
| ESLint 未安装 | 检测并跳过，仅输出警告 |
| Schema 不兼容 | 版本字段 + 向后兼容解析 |
| 性能影响 | Lint 仅在 Green 阶段运行 |
| 配置冲突 | 明确优先级顺序 |
