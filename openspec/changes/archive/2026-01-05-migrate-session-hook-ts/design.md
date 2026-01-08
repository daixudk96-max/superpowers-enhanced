# Design: Session Hook Migration

## Architecture Decision

### 选择: 完整重写 (Option A)

**理由**:
1. 原脚本仅 53 行，逻辑简单 (读文件 → 转义 → 输出 JSON)
2. 跨语言迁移，逐行翻译会带入 Bash 路径处理的坑
3. TypeScript 有更好的工具链 (`JSON.stringify`, `path.join`)

### 替代方案: 逐行翻译 (Option B)

**不选择的原因**:
- 需要模拟 Bash 的 `escape_for_json` 函数
- 路径处理方式 (`$(cd ... && pwd)`) 在 Node 中无直接对应
- 代码会更冗长，不利于维护

## Component Design

### 新文件: `src/hooks/session-start.ts`

```typescript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// 确定插件根目录 (从 dist/hooks/ 回溯到项目根)
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

// 读取 using-superpowers skill
const skillPath = path.join(PLUGIN_ROOT, 'skills', 'using-superpowers', 'SKILL.md');
let skillContent: string;
try {
    skillContent = fs.readFileSync(skillPath, 'utf8');
} catch (err) {
    console.error(`Error reading skill: ${skillPath}`);
    process.exit(1);
}

// 检测 legacy skills 目录
const legacyDir = path.join(os.homedir(), '.config', 'superpowers', 'skills');
let warningMessage = '';
if (fs.existsSync(legacyDir)) {
    warningMessage = '\n\n<important-reminder>...</important-reminder>';
}

// 构建输出 (利用 JSON.stringify 自动转义)
const output = {
    hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<EXTREMELY_IMPORTANT>\nYou have superpowers-fusion.\n\n${skillContent}\n${warningMessage}\n</EXTREMELY_IMPORTANT>`
    }
};

console.log(JSON.stringify(output, null, 2));
```

### 修改: `src/cli/init.ts`

```diff
- const hookPath = path.join(fusionRoot, 'hooks', 'session-start.sh');
- const cmd = process.platform === 'win32' ? `bash "${hookPath}"` : `"${hookPath}"`;
+ const hookPath = path.join(fusionRoot, 'dist', 'hooks', 'session-start.js');
+ const cmd = `node "${hookPath}"`;
```

## Edge Cases

| 场景 | 处理方式 |
|------|----------|
| SKILL.md 不存在 | `process.exit(1)` + stderr 错误信息 |
| 路径含空格 | `node "..."` 原生支持 |
| Windows CRLF | `fs.readFileSync` 保持原样，`JSON.stringify` 正确转义 |
| Legacy 目录在 Windows | 使用 `os.homedir()` 跨平台获取 |
| 输出非 0 退出码 | 仅在错误时返回 1，成功时返回 0 |

## Testing Strategy

1. **单元测试**: Mock `fs.readFileSync`，验证输出结构
2. **对拍测试**: 比较新旧脚本输出 (需手动运行旧脚本保存基线)
3. **集成测试**: 全流程 `init` → 检查 `settings.json` → 模拟 Claude Code 调用
