# 任务: integrate-superpowers-parity

## 阶段 0: 准备

- [x] 0.1 确认缺失组件清单 <!-- 风险: Tier-0 -->

---

## 阶段 1: 核心库 (P0)

- [x] 1.1 **复制** `lib/skills-core.js`（直接使用，无需转 TS） <!-- 风险: Tier-1 -->
- [x] 1.2 更新 `.opencode/plugin/superpowers.js` 导入路径 <!-- 风险: Tier-2 -->
- [x] 1.3 更新 `.codex/superpowers-codex` require 路径 <!-- 风险: Tier-2 -->

---

## 阶段 2: OpenSpec Validate (P0)

- [x] 2.1 创建 `src/cli/openspec-validate.ts` <!-- 风险: Tier-2 -->
- [x] 2.2 实现校验逻辑 <!-- 风险: Tier-2 -->
- [x] 2.3 注册 CLI 子命令 <!-- 风险: Tier-2 -->

---

## 阶段 3: 技能补齐与增强 (P1)

### 3.1 直接复制

- [x] 3.1.1 **复制** `skills/receiving-code-review/` <!-- 风险: Tier-1 -->

### 3.2 复制并增强 `systematic-debugging`

- [x] 3.2.1 **复制** `skills/systematic-debugging/` <!-- 风险: Tier-1 -->
- [x] 3.2.2 添加 Codex 协作点（Phase 1/3/4 必须，Phase 2 可选） <!-- 风险: Tier-2 -->

### 3.3 恢复原版 `subagent-driven-development` + Codex 辅助

- [x] 3.3.1 **复制** 原版 `skills/subagent-driven-development/`（含模板文件） <!-- 风险: Tier-1 -->
- [x] 3.3.2 添加 Codex 协作规范章节 <!-- 风险: Tier-2 -->
- [x] 3.3.3 在 Implementer 阶段添加"向 Codex 索要代码原型" <!-- 风险: Tier-2 -->
- [x] 3.3.4 在 Code Quality Reviewer 阶段添加"必须 Codex review" <!-- 风险: Tier-2 -->

---

## 阶段 4: SessionStart 钩子 (P1)

- [x] 4.1 **复制** `hooks/session-start.sh` 并适配路径 <!-- 风险: Tier-2 -->
- [-] 4.2 更新 `src/cli/init.ts` 注册钩子 <!-- 跳过: init 已有注册机制 -->

---

## 阶段 5: 验证 (P1)

- [x] 5.1 运行 `npm run build` 验证构建 <!-- 风险: Tier-2 -->
- [x] 5.2 验证 14 个技能完整 <!-- 风险: Tier-1 -->
- [-] 5.3 更新 README/CLAUDE.md <!-- 后续迭代 -->

---

**图例**: `[ ]` 待处理 | `[x]` 完成 | `[~]` 进行中 | `[-]` 跳过

