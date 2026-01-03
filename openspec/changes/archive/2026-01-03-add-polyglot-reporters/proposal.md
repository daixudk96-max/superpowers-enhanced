# 提案：多语言测试报告器整合（方案B：打包到主包）

## 概述

将 tdd-guard 的多语言 reporters 打包到 superpowers-fusion 主包中，用户安装一次即可使用所有语言支持。

---

## ✅ 兼容层分析结果

**结论：不需要兼容层！**

搜索所有读取测试结果的代码，发现：

| 文件 | 读取方式 | 状态 |
|------|---------|------|
| `lib/test-status-checker.ts` | `report.summary.passed/failed` | ✅ 新格式 |
| `lib/pipeline.ts` | `testResult.summary.passed/failed` | ✅ 新格式 |
| `lib/schemas.ts` | `report.summary.failed === 0` | ✅ 新格式 |

**原因：** 所有代码从一开始就设计为读取 `UnifiedTestReportSchema` 格式，只是 vitest-reporter 之前输出了错误格式。现在已修复，无需兼容层。

---

## 方案 B：打包到主包

### 目录结构

```
superpowers-fusion/
├── lib/
│   └── reporters/
│       ├── vitest-reporter.ts    # 当前已修复
│       ├── jest-reporter.ts      # 复制自 tdd-guard
│       ├── types.ts              # 共享类型
│       └── python/
│           └── pytest_reporter.py # 复制自 tdd-guard
```

### 安装流程

```bash
# 用户只需安装主包
npm install superpowers-fusion

# 自动检测并配置
npx superpowers-fusion install-reporter

# 输出示例
检测到：Python 项目 (pytest)
已复制：.fusion/reporters/pytest_reporter.py
请添加到 pytest 配置：-p .fusion.reporters.pytest_reporter
```

---

## 任务清单

### 已完成

- [x] 修复 vitest-reporter.ts 输出格式
- [x] 确认无需兼容层

### 待完成

- [ ] 复制 tdd-guard jest-reporter 并适配
- [ ] 复制 tdd-guard pytest-reporter 并适配
- [ ] 扩展 install-reporter CLI 支持多语言
- [ ] 扩展 tech-detector.ts 检测语言
- [ ] 更新 CLAUDE.md 文档

---

## 验证计划

```bash
npx tsc --noEmit                    # 编译检查
npx vitest run                      # 现有测试
cat .fusion/test-results.json       # JSON 格式验证
```
