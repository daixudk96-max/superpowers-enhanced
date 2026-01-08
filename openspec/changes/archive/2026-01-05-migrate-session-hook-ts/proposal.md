# Migrate Session Hook to TypeScript

## Summary

将 `hooks/session-start.sh` (Bash) 迁移为 `src/hooks/session-start.ts` (TypeScript)，解决 Windows 路径含空格时的执行失败问题。

## Problem Statement

当前 `session-start.sh` 通过 `bash "C:\path with spaces\..."` 调用。由于：
1. Windows 上 Bash 对空格路径处理不稳定
2. JSON 序列化时路径转义出现问题
3. 依赖用户系统安装 WSL/Git Bash

导致在含空格目录下安装 Superpowers-Fusion 后，Claude Code SessionStart hook 无法正常执行。

## Proposed Solution

**策略**: 完整重写 (Option A)

由于这是跨语言迁移 (Bash → TypeScript)，且原脚本逻辑简单，采用"完整重写"策略：
1. 保留行为契约（输出 JSON 格式不变）
2. 使用 Node.js 原生能力替换 Bash 字符串处理
3. 利用 `JSON.stringify` 处理所有转义，避免手写转义器

### Migration Strategy Framework

| 条件 | 策略 | 示例 |
|------|------|------|
| 同语言迁移 | 复制 → 适配 | `.js` → `.ts` (仅加类型) |
| 跨语言迁移 (逻辑简单) | 完整重写 | `.sh` → `.ts` (本次) |
| 跨语言迁移 (逻辑复杂) | 逐段翻译 + 对拍测试 | `.py` → `.ts` |

## Impact Analysis

| 组件 | 影响 |
|------|------|
| `hooks/session-start.sh` | 标记弃用，保留作为对照 |
| `src/hooks/session-start.ts` | 新增 |
| `src/cli/init.ts` | 修改 hook 命令从 `bash "..."` 改为 `node "..."` |
| `~/.claude/settings.json` | 用户需重新运行 `init` 更新 hook 路径 |

## Risks and Mitigations

| 风险 | 缓解措施 |
|------|----------|
| 输出格式不一致 | 添加对拍测试，比较新旧输出 |
| Edge case 遗漏 | 测试: 空格路径、缺失文件、legacy 目录 |
| 用户需重新 init | 在 CHANGELOG 中说明 |

## Approval Required

- [ ] 确认迁移策略 (完整重写 vs 逐行翻译)
- [ ] 确认是否保留 `session-start.sh` 作为备份
