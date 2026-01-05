# Tasks

## 项目路径参考

| 项目 | 名称 | 路径 |
|------|------|------|
| **原版** | `superpowers` | `C:\github\merage surperpower\superpowers` |
| **目标** | `superpowers-fusion` | `C:\github\merage surperpower\superpowers-fusion` |

---

## Phase 1: 内容同步 (无代码变更)

- [x] 1.1 对比 `superpowers/skills/using-git-worktrees/SKILL.md` (原版 218 行) vs `superpowers-fusion/skills/using-git-worktrees/SKILL.md` (Fusion 113 行) <!-- Risk: Tier-0 -->
- [x] 1.2 增量合并原版内容到 Fusion 版 (保留 Fusion Codex 扩展) <!-- Risk: Tier-0 -->
- [x] 1.3 对比 `superpowers/skills/dispatching-parallel-agents/SKILL.md` (原版 181 行) vs `superpowers-fusion/skills/dispatching-parallel-agents/SKILL.md` (Fusion 91 行) <!-- Risk: Tier-0 -->
- [x] 1.4 增量合并原版内容到 Fusion 版 <!-- Risk: Tier-0 -->

---

## Phase 2: Worktree 程序化集成

### 2.1 核心模块 (superpowers-fusion/lib/worktree-manager.ts)
- [x] 2.1.1 写失败测试: `detectWorktreeDir()` 检测目录优先级 <!-- Risk: Tier-3 -->
- [x] 2.1.2 实现目录检测逻辑 (`.worktrees` → `worktrees` → CLAUDE.md) <!-- Risk: Tier-3 -->
- [x] 2.1.3 写失败测试: `createWorktree()` 创建工作树 <!-- Risk: Tier-3 -->
- [x] 2.1.4 实现创建逻辑 (git worktree add + 分支) <!-- Risk: Tier-3 -->
- [x] 2.1.5 写失败测试: `verifyIgnored()` 确保 .gitignore <!-- Risk: Tier-3 -->
- [x] 2.1.6 实现忽略验证逻辑 <!-- Risk: Tier-2 -->

### 2.2 Implement 命令集成 (superpowers-fusion/commands/implement.ts)
- [x] 2.2.1 扩展 `.fusion/status.json` 支持 `worktreePath` 和 `worktreeBranch` <!-- Risk: Tier-2 -->
- [x] 2.2.2 修改 implement.ts: 默认启用 worktree <!-- Risk: Tier-2 -->
- [x] 2.2.3 添加 `--no-worktree` CLI 标志 <!-- Risk: Tier-1 -->

### 2.3 Archive 命令集成 (superpowers-fusion/commands/archive.ts)
- [x] 2.3.1 写失败测试: `checkBranchMerged()` 检测分支合并状态 <!-- Risk: Tier-3 -->
- [x] 2.3.2 实现 `checkBranchMerged()` 使用 `git merge-base --is-ancestor` <!-- Risk: Tier-2 -->
- [x] 2.3.3 写失败测试: `handleWorktreeBeforeArchive()` 各路径 <!-- Risk: Tier-3 -->
- [x] 2.3.4 实现 `handleWorktreeBeforeArchive()` 逻辑:
  - 读取 status.json
  - 检查分支合并状态
  - 提示用户确认合并
  - 执行 git merge
  <!-- Risk: Tier-3 -->
- [x] 2.3.5 ★ 实现 Git 存档: `git archive --format=zip HEAD -o <path>` <!-- Risk: Tier-2 -->
- [x] 2.3.6 执行 git worktree remove <!-- Risk: Tier-2 -->
- [x] 2.3.7 修改 archive.ts: 在步骤 2 后调用 `handleWorktreeBeforeArchive()` <!-- Risk: Tier-2 -->
- [x] 2.3.8 添加 `--no-merge` 和 `--no-zip` CLI 标志 <!-- Risk: Tier-1 -->

### 2.4 CLI 命令 (superpowers-fusion/commands/worktree.ts)
- [x] 2.4.1 创建 worktree.ts (create/list/cleanup 子命令) <!-- Risk: Tier-2 -->
- [ ] 2.4.2 注册到 package.json scripts <!-- Risk: Tier-0 -->

---

## Phase 3: 并发调度集成

### 3.1 任务分组解析 (superpowers-fusion/lib/task-parser.ts)
- [x] 3.1.1 写失败测试: `parseTasksWithParallel()` 提取 `<!-- parallel: groupId -->` <!-- Risk: Tier-3 -->
- [x] 3.1.2 实现解析逻辑 <!-- Risk: Tier-2 -->
- [x] 3.1.3 写失败测试: 任务依赖检测 <!-- Risk: Tier-3 -->
- [x] 3.1.4 实现依赖解析 (phase header 层级) <!-- Risk: Tier-2 -->

### 3.2 锁机制 (superpowers-fusion/lib/lock-manager.ts)
- [x] 3.2.1 写失败测试: `acquireLock()` / `releaseLock()` <!-- Risk: Tier-3 -->
- [x] 3.2.2 实现原子锁逻辑 (`fs.openSync('wx')`) <!-- Risk: Tier-2 -->
- [x] 3.2.3 写失败测试: `cleanupStaleLocks()` <!-- Risk: Tier-3 -->
- [x] 3.2.4 实现超时清理 (默认 30 分钟) <!-- Risk: Tier-2 -->

### 3.3 并发执行 (superpowers-fusion/lib/parallel-dispatcher.ts)
- [x] 3.3.1 写失败测试: 多 Agent 启动 <!-- Risk: Tier-3 -->
- [x] 3.3.2 实现 `child_process.spawn` 分发逻辑 <!-- Risk: Tier-3 -->
- [x] 3.3.3 实现日志聚合 (prefixed by task ID) <!-- Risk: Tier-2 -->
- [x] 3.3.4 实现完成检测和结果汇总 <!-- Risk: Tier-2 -->

### 3.4 CLI 命令 (superpowers-fusion/commands/dispatch.ts)
- [x] 3.4.1 创建 dispatch.ts 骨架 (解析 tasks.md, 调用 dispatcher) <!-- Risk: Tier-2 -->
- [x] 3.4.2 添加 `--dry-run` 标志 <!-- Risk: Tier-1 -->
- [ ] 3.4.3 注册到 package.json scripts <!-- Risk: Tier-0 -->

---

## Phase 4: 测试与文档

- [ ] 4.1 集成测试: Worktree 完整生命周期 (create → work → archive merge → git archive → cleanup) <!-- Risk: Tier-2 -->
- [ ] 4.2 集成测试: Archive 合并冲突处理 <!-- Risk: Tier-3 -->
- [ ] 4.3 集成测试: 两个并发 Agent 领取不同任务 <!-- Risk: Tier-3 -->
- [ ] 4.4 集成测试: 锁竞争和重试行为 <!-- Risk: Tier-3 -->
- [ ] 4.5 更新 `superpowers-fusion/commands/archive.md` 说明新流程 <!-- Risk: Tier-1 -->
- [ ] 4.6 更新 `superpowers-fusion/commands/implement.md` 说明 worktree 标志 <!-- Risk: Tier-1 -->
- [ ] 4.7 更新 `superpowers-fusion/skills/using-git-worktrees/SKILL.md` Integration 部分 <!-- Risk: Tier-0 -->

---

## Phase 5: 端到端验证

```bash
# 在 superpowers-fusion 目录下执行
cd "C:\github\merage surperpower\superpowers-fusion"

# 完整流程
npm run new-change -- test-worktree
npm run implement -- test-worktree
# ... 完成任务 ...
npm run archive -- test-worktree
# → 验证: 自动合并 + Git 存档 (.zip) + worktree 清理 + 归档成功
```

- [ ] 5.1 完整流程验证 <!-- Risk: Tier-2 -->
- [ ] 5.2 并发流程验证 <!-- Risk: Tier-3 -->
