# 任务清单

## 阶段 1: 补齐核心命令

- [ ] 复制 `superpowers/commands/execute-plan.md` 到 `superpowers-fusion/commands/`
- [ ] 创建 `commands/execute-plan.ts` 实现（参考 `implement.ts` 模式）
- [ ] 更新 `commands/index.ts` 导出新命令

## 阶段 2: 可选配置迁移

- [ ] **[待决策]** `.github/FUNDING.yml` 迁移（等待用户确认）

## 阶段 3: 验证

- [ ] 运行现有测试套件验证无回归
- [ ] 验证 `/execute-plan` 命令可成功调用
- [ ] 验证工作流阶段正确切换到 `executing-plans`
- [ ] 端到端测试完整命令链路

## 依赖关系

```
阶段 1 ─┬─→ 阶段 3 (核心验证)
阶段 2 ─┘   (可并行)
```
