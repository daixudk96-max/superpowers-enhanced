# 任务清单：多语言测试报告器（方案 B：打包到主包）

## ✅ 阶段 1：修复 Vitest Reporter（已完成）

- [x] **1.1** 修改 `lib/vitest-reporter.ts` 输出 `UnifiedTestReportSchema` 格式
- [x] **1.2** 添加 `summary: { passed, failed, skipped }` 包装
- [x] **1.3** 添加 `reason: "passed" | "failed"` 字段
- [x] **1.4** 验证 43 个测试全部通过
- [x] **1.5** 确认无需兼容层（所有代码已使用新格式）

---

## 阶段 2：复制并适配 Jest Reporter

- [x] **2.1** 从 tdd-guard 复制 `reporters/jest/src/JestReporter.ts`
- [x] **2.2** 从 tdd-guard 复制 `reporters/jest/src/types.ts`
- [x] **2.3** 适配 import：`from 'tdd-guard'` → `from '../storage.js'`
- [x] **2.4** 放入 `lib/reporters/jest-reporter.ts`
- [x] **2.5** 验证编译通过

---

## 阶段 3：复制并适配 Pytest Reporter

- [x] **3.1** 从 tdd-guard 复制 `reporters/pytest/tdd_guard_pytest/pytest_reporter.py`
- [x] **3.2** 修改存储路径：`.claude/tdd-guard/data` → `.fusion`
- [x] **3.3** 放入 `lib/reporters/python/pytest_reporter.py`

---

## 阶段 4：扩展语言检测

- [x] **4.1** 扩展 `lib/tech-detector.ts` 语言类型
  - 添加：`python`, `go`, `ruby`, `rust`, `php`, `java`
- [x] **4.2** 添加语言标记文件检测
  - Python: `requirements.txt`, `pyproject.toml`
  - Go: `go.mod`
  - Ruby: `Gemfile`
  - Rust: `Cargo.toml`
  - PHP: `composer.json`

---

## 阶段 5：扩展 install-reporter CLI

- [x] **5.1** 修改 `src/cli/install-reporter.ts`
- [x] **5.2** 检测语言 → 复制对应 reporter 到 `.fusion/reporters/`
- [x] **5.3** 输出语言特定的配置指导

---

## 阶段 6：文档更新

- [x] **6.1** 更新 `CLAUDE.md` 多语言 reporter 文档
- [x] **6.2** 更新 `.env.example` 配置项

---

## 验证清单

- [x] vitest-reporter 输出正确格式
- [x] 43 个现有测试通过
- [x] jest-reporter 编译通过
- [x] pytest-reporter 可复制到项目
- [x] install-reporter 自动检测语言
- [x] 语言检测对 Python/Go 等准确
