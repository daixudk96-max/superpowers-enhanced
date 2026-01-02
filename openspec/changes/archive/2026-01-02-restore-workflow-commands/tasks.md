# 任务 (Tasks)

## 第零阶段：基线对齐 (Phase 0: Baseline Alignment)

- [x] 0.1 将 Conductor TOML 文件复制到 `prompts/conductor/` 目录 <!-- Risk: Tier-1 -->
- [x] 0.2 创建 TOML → 内存模型的加载器 `lib/prompt-loader.ts` <!-- Risk: Tier-2 -->

## 第一阶段：交互式设置 (Phase 1: Interactive Setup)

- [x] 1.1 实现褐地检测 (Brownfield Detection) <!-- Risk: Tier-2 -->
  - 检查 .git, package.json
  - 从文件中推断技术栈
- [x] 1.2 实现交互式提示 (Interactive Prompts) <!-- Risk: Tier-2 -->
  - 产品定义问卷
  - 技术栈确认
  - 工作流自定义
- [x] 1.3 更新 `setup.ts` 以使用交互式逻辑 <!-- Risk: Tier-3 -->
  - 添加 `--interactive` 标志（新项目默认为此）
  - 创建 `.fusion/` 和 `changes/` 目录

## 第二阶段：状态命令 (Phase 2: Status Command)

- [x] 2.1 创建 `commands/status.ts` <!-- Risk: Tier-2 -->
  - 定义 `StatusResult` 接口
- [x] 2.2 实现状态逻辑 (Status Logic) <!-- Risk: Tier-2 -->
  - 从 `tasks.md` 读取活动变更
  - 计算进度百分比
  - 显示标准化状态报告

## 第三阶段：实现逻辑 (Phase 3: Implement Logic)

- [x] 3.1 创建 `commands/implement.ts` <!-- Risk: Tier-2 -->
  - 轨道/变更选择逻辑
- [x] 3.2 与技能集成 (Integrate with Skills) <!-- Risk: Tier-3 -->
  - 为选定的变更调用 `executing-plans` 技能

## 第四阶段：验证 (Phase 4: Verification)

- [x] 4.1 创建黄金样例项目对比行为 <!-- Risk: Tier-2 -->
- [x] 4.2 为关键逻辑补单元测试 <!-- Risk: Tier-2 -->
