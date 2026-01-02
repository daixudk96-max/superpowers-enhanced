# 任务 (Tasks)

## 第一阶段：交互式设置 (Phase 1: Interactive Setup)

- [ ] 1.1 实现褐地检测 (Brownfield Detection) <!-- Risk: Tier-2 -->
  - 检查 .git, package.json
  - 从文件中推断技术栈
- [ ] 1.2 实现交互式提示 (Interactive Prompts) <!-- Risk: Tier-2 -->
  - 产品定义问卷
  - 技术栈确认
  - 工作流自定义
- [ ] 1.3 更新 `setup.ts` 以使用交互式逻辑 <!-- Risk: Tier-3 -->
  - 添加 `--interactive` 标志（新项目默认为此）

## 第二阶段：状态命令 (Phase 2: Status Command)

- [ ] 2.1 创建 `commands/status.ts` <!-- Risk: Tier-2 -->
  - 定义 `StatusResult` 接口
- [ ] 2.2 实现状态逻辑 (Status Logic) <!-- Risk: Tier-2 -->
  - 从 `tasks.md` 读取活动变更
  - 计算进度百分比
  - 显示标准化状态报告

## 第三阶段：实现逻辑 (Phase 3: Implement Logic)

- [ ] 3.1 创建 `commands/implement.ts` <!-- Risk: Tier-2 -->
  - 轨道/变更选择逻辑
- [ ] 3.2 与技能集成 (Integrate with Skills) <!-- Risk: Tier-3 -->
  - 为选定的变更调用 `executing-plans` 技能
