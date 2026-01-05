# Tasks: Unify Skill Workflow Chain

## 依赖关系

```
Task 1 (implement.md 精简) ─┐
Task 2 (executing-plans)   ├──> Task 6 (handoff 统一)
Task 3 (writing-plans)     │
Task 4 (creating-changes)  ─┘
Task 5 (archiving-changes) ──> Task 6
Task 6 (handoff 统一) ──> Task 7 (验证)
```

## 任务清单

### Phase 1: 核心 Skills 修改

- [x] **Task 1**: 精简 `commands/implement.md`
  - 删除第 29-86 行与 SKILL 重复的内容
  - 保留标题、用法说明、链式调用入口
  - 预期结果: 约 15 行
  - 验证: 文件行数 < 20

- [x] **Task 2**: 修改 `skills/executing-plans/SKILL.md`
  - 增加 Step 0: 环境确认 (Worktree、Plan、状态恢复)
  - 末尾增加 finish/archive 引导
  - 验证: 包含 "Step 0" 和 "下一步" 标记

- [x] **Task 3**: 修改 `skills/writing-plans/SKILL.md`
  - 在 Execution Handoff 增加用户审阅阻断 (⚠️ 必须等待)
  - 增加 Worktree 调用 (REQUIRED SUB-SKILL)
  - 增加执行方式选择提示
  - 验证: 包含 "用户确认" 和 "using-git-worktrees" 引用

### Phase 2: 新建 Skills

- [x] **Task 4**: 新建 `skills/creating-changes/SKILL.md`
  - 创建目录 `skills/creating-changes/`
  - 编写 SKILL.md (参考 design.md 模板)
  - 验证: 文件存在且包含 "writing-plans" 引用

- [x] **Task 5**: 新建 `skills/archiving-changes/SKILL.md`
  - 创建目录 `skills/archiving-changes/`
  - 编写 SKILL.md (参考 design.md 模板)
  - 验证: 文件存在且包含 "metadata.json" 和 "Worktree 清理"

### Phase 3: Handoff 统一

- [x] **Task 6**: 为所有相关 Skills/Commands 添加末尾 handoff
  - `brainstorming/SKILL.md` → 添加 "下一步运行 /new-change"
  - `finishing-a-development-branch/SKILL.md` → 添加 "下一步运行 /archive"
  - `new-change.md` → 添加 "调用 superpowers:writing-plans"
  - 验证: `rg "下一步" skills/` 返回预期文件

### Phase 4: 验证

- [x] **Task 7**: 完整流程验证
  - 验证 Step 5 Worktree 清理存在于 `finishing-a-development-branch/SKILL.md`
  - Dry-run 检查链式调用完整性
  - 运行 `openspec validate unify-skill-workflow-chain --strict`

## 可并行任务

| 可并行 | 任务 |
|--------|------|
| ✅ | Task 1, 2, 3 (互不依赖的核心修改) |
| ✅ | Task 4, 5 (新建 Skills) |
| ❌ | Task 6 (需等待 Phase 1-2 完成) |
| ❌ | Task 7 (需等待所有任务完成) |
