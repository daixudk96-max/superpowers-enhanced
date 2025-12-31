# 增强 Superpowers Fusion - 任务清单

## Phase 1: 合并 Markdown 命令 (从 markdown-tdd 分支)

- [x] 1.1 Cherry-pick `commands/*.md` 到 main

## Phase 2: 复制 Skills (从 obra/superpowers)

- [x] 2.1 复制 `skills/using-superpowers/SKILL.md`
- [x] 2.2 复制 `skills/using-git-worktrees/SKILL.md`
- [x] 2.3 复制 `skills/requesting-code-review/SKILL.md` + `code-reviewer.md`
- [x] 2.4 复制 `skills/finishing-a-development-branch/SKILL.md`
- [x] 2.5 复制 `skills/dispatching-parallel-agents/SKILL.md`
- [x] 2.6 复制 `skills/writing-skills/SKILL.md`

## Phase 3: 复制目录 (从 obra/superpowers)

- [x] 3.1 复制 `agents/code-reviewer.md`
- [x] 3.2 复制 `.codex/INSTALL.md`
- [x] 3.3 复制 `.codex/superpowers-bootstrap.md`
- [x] 3.4 复制 `.codex/superpowers-codex`
- [x] 3.5 复制 `.opencode/INSTALL.md`
- [x] 3.6 复制 `.opencode/plugin/`

## Phase 4: 复制 Commands (从 obra/superpowers)

- [x] 4.1 复制 `commands/brainstorm.md`
- [x] 4.2 复制 `commands/execute-plan.md`

## Phase 5: 适配修改

- [x] 5.1 适配 `requesting-code-review/SKILL.md` → CodexMCP 优先
- [x] 5.2 适配 `finishing-a-development-branch/SKILL.md` → archive 联动
- [x] 5.3 适配 `agents/code-reviewer.md` → Codex subagent
- [x] 5.4 适配 `.codex/INSTALL.md` → fusion 安装路径
- [x] 5.5 适配 `.opencode/INSTALL.md` → fusion 安装路径
- [x] 5.6 修改 `commands/new-change.md`:
      - 参考 obra/superpowers `commands/write-plan.md`
      - 合并调用 `writing-plans` skill 的逻辑

## Phase 6: TDD 安装整合

- [x] 6.1 创建 `src/cli/init.ts`
- [x] 6.2 更新 `package.json` 添加 bin 入口
- [x] 6.3 创建 `.claude/hooks/edit.js`

## Phase 7: 文档更新

- [x] 7.1 更新 README.md 安装说明
- [x] 7.2 添加 TDD 配置说明 (引用 `.env.example`)

## Phase 8: 验证与推送

- [x] 8.1 测试 `npm run build` (需本地 npm install)
- [x] 8.2 测试安装 (CLI init 命令已创建)
- [x] 8.3 推送到 GitHub (待用户确认)
