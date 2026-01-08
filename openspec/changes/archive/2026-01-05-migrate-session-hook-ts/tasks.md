# Tasks: migrate-session-hook-ts

## Phase 1: Preparation

- [x] 1.1 保存基线输出
  - 运行现有 `session-start.sh`，保存输出为 `tests/fixtures/session-start-baseline.json`
  - 包含两种情况: 有/无 legacy skills 目录

- [x] 1.2 确认 hook 契约
  - 检查 Claude Code 对 SessionStart hook 输出的要求
  - 确认 `hookSpecificOutput.additionalContext` 格式

## Phase 2: Implementation

- [x] 2.1 创建 `src/hooks/session-start.ts`
  - 使用 `fs.readFileSync` 读取 `skills/using-superpowers/SKILL.md`
  - 使用 `JSON.stringify` 生成 JSON 输出
  - 检测 legacy directory (`~/.config/superpowers/skills`)
  - 输出到 stdout，错误到 stderr

- [x] 2.2 更新 `src/cli/init.ts`
  - 修改 SessionStart hook 命令:
    ```typescript
    // 旧: bash "${hookPath}"
    // 新: node "${hookPath.replace('.sh', '.js')}"
    ```
  - 更新 hook 路径指向编译后的 JS 文件
  - **新增**: 移除旧的 .sh hook 避免重复

- [x] 2.3 编译验证
  - 运行 `npm run build`
  - 确认 `dist/src/hooks/session-start.js` 生成

## Phase 3: Testing

- [x] 3.1 单元测试
  - 运行 `npm test` - 43 tests passed

- [x] 3.2 对拍测试
  - 比较新旧输出 JSON 结构一致性
  - 验证 `additionalContext` 内容完全相同

- [x] 3.3 手动验证
  - Windows: `node dist/src/hooks/session-start.js` ✓

## Phase 4: Deployment

- [x] 4.1 更新 README
  - 说明 hook 机制变更 (通过弃用注释)

- [x] 4.2 标记 `session-start.sh` 弃用
  - 添加注释说明迁移至 TypeScript

- [x] 4.3 重新安装测试
  - `npm run build && npm install -g . && superpowers-fusion init` ✓
  - 检查 `~/.claude/settings.json` 中 hook 路径 ✓

## Dependencies

- Phase 2 依赖 Phase 1 完成 ✓
- Phase 3 依赖 Phase 2 完成 ✓
- Phase 4 依赖 Phase 3 测试通过 ✓

## Parallel Work

- 1.1 和 1.2 可并行 ✓
- 3.1, 3.2, 3.3 可并行 ✓
