# 整合 GitHub 配置与工作流闭环

## 概述

将原版 `obra/superpowers` 的 GitHub 配置和核心命令流程完整迁移到 `superpowers-fusion`，补齐工作流缺口，实现端到端的命令链路自动调用。

## 用户审查事项

> [!IMPORTANT]
> **关于 `.github/FUNDING.yml` 的迁移决策**
> 
> 原版 `.github/FUNDING.yml` 仅包含 GitHub Sponsors 配置（`github: [obra]`）。这是一个**功能无关**的配置文件，仅影响 GitHub 仓库页面是否显示赞助按钮。
> 
> **选项 A**: 不迁移（推荐） - fusion 是独立项目，可创建新的 FUNDING.yml 或不使用此功能  
> **选项 B**: 迁移并修改 - 复制文件后更新为 fusion 项目的赞助信息

> [!WARNING]
> **工作流闭环的关键缺口**
> 
> 当前 `execute-plan.md` 和 `execute-plan.ts` 文件**完全缺失**，导致工作流链路断裂：
> - `/brainstorm` ✅ → `/write-plan` ✅ → `/implement` ✅ → `/execute-plan` ❌ → `/archive` ✅

---

## 变更分析

### 原版与 Fusion 命令对比

| 原版 superpowers | superpowers-fusion | 状态 | 说明 |
|-----------------|-------------------|------|------|
| `brainstorm.md` | `brainstorm.md` | ✅ 已迁移 | 一字未改，技能调用 |
| `write-plan.md` | `write-plan.md` | ✅ 已迁移 | 一字未改，技能调用 |
| `execute-plan.md` | ❌ 缺失 | 🔴 需补齐 | 关键缺口 |
| — | `implement.md/.ts` | ✅ 新增 | Fusion 扩展，依赖 execute-plan |
| — | `setup.md/.ts` | ✅ 新增 | Fusion 扩展 |
| — | `status.md/.ts` | ✅ 新增 | Fusion 扩展 |
| — | `new-change.md/.ts` | ✅ 新增 | Fusion 扩展 |
| — | `archive.md/.ts` | ✅ 新增 | Fusion 扩展 |
| — | `revert.md/.ts` | ✅ 新增 | Fusion 扩展 |

### 工作流整合现状

**已整合的阶段映射** (来自 `lib/workflow-middleware.ts`):
- `/brainstorm` → `brainstorming` (TDD 豁免)
- `/write-plan` → `writing-plans` (TDD 豁免)
- `/implement` → `implement` (TDD 强制)
- `/execute-plan` → `executing-plans` (TDD 强制) **← 阶段已定义，命令缺失**
- `/archive` → `archive` (TDD 豁免)

**测试覆盖** (来自 `tests/workflow-middleware.test.ts`):
- `phaseFromCommand("/execute-plan")` 已有测试 (L151-153)
- `shouldBlockOnFailure("executing-plans")` 已有测试 (L99-108)

---

## 提案变更

### 1. 补齐 `execute-plan` 命令

**[NEW] `commands/execute-plan.md`**
- 复制原版 `superpowers/commands/execute-plan.md`（技能调用格式）
- 无需修改，保持与原版一致

**[NEW] `commands/execute-plan.ts`**
- 新增 TypeScript 实现，职责：
  1. 设置工作流阶段为 `executing-plans`
  2. 读取当前活动变更的 `tasks.md`
  3. 找到第一个未完成任务 `- [ ]`
  4. 输出任务执行提示/调用 executing-plans 技能
  5. 更新任务状态追踪

### 2. [可选] 创建 `.github/FUNDING.yml`

根据用户决策：
- **选项 A**: 不创建
- **选项 B**: 创建新文件，配置 fusion 项目赞助信息

### 3. 更新命令索引

**[MODIFY] `commands/index.ts`**
- 导出新的 `execute-plan` 命令

---

## 验证计划

### 自动化测试

```bash
# 运行现有单元测试验证不破坏现有功能
npm test

# 验证 workflow-middleware 测试通过（已包含 execute-plan 阶段测试）
npx vitest tests/workflow-middleware.test.ts --run
```

### 手动验证

1. **命令调用链验证**:
   ```bash
   # 验证 execute-plan 命令可被调用
   npx tsx commands/execute-plan.ts
   ```

2. **工作流阶段验证**:
   - 调用 `/implement` 后检查 `.fusion/workflow-state.json` 阶段为 `implement`
   - 调用 `/execute-plan` 后检查阶段切换为 `executing-plans`

3. **端到端流程**:
   - `/brainstorm` → `/write-plan` → `/implement` → `/execute-plan` → `/archive`
   - 验证每个阶段状态正确转换
