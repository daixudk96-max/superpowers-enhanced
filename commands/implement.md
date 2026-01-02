# /implement - 选择变更并执行任务

选择一个变更（change）并循环执行其任务直到完成。

## 用法

```bash
# 使用活动变更
npx tsx commands/implement.ts

# 指定变更名称
npx tsx commands/implement.ts my-feature
```

## 执行流程

```
选择变更 → 读取 tasks.md → 找到下一个未完成任务 → 执行 → 标记完成 → 循环 → 全部完成时提示归档
```

## 你需要执行的步骤

### 1. 选择变更

1. **检查参数**：如果用户提供了变更名称，使用该名称
2. **使用活动变更**：否则读取 `.fusion/status.json` 获取当前活动变更
3. **列出可用变更**：如果都没有，显示 `changes/` 下的可用变更让用户选择

### 2. 加载任务计划

1. 读取 `changes/{name}/tasks.md`
2. 解析所有 `- [ ]` 和 `- [x]` 项
3. 找到第一个 `- [ ]` 未完成任务

### 3. 执行任务循环

**对于每个未完成任务：**

1. **Pre-implementation (Codex 原型)**
   ```
   向 Codex 请求 unified diff patch（read-only 模式）
   ```

2. **实现代码**
   - 根据 Codex 原型编写生产级代码
   - 遵循项目风格和 TDD 要求

3. **测试**
   - 运行相关测试确保通过
   - 检查 Risk Tier 对应的 TDD 要求

4. **Codex Review**
   ```
   向 Codex 请求代码审查，检查逻辑正确性和潜在问题
   ```

5. **提交**
   - `git add .`
   - `git commit -m "feat(task-id): 描述"`

6. **更新状态**
   - 在 `tasks.md` 中将 `- [ ]` 改为 `- [x]`
   - 在 `.fusion/status.json` 中记录 commit SHA

7. **继续下一个任务** 或 **完成后提示归档**

### 4. 完成时

当所有任务标记为 `[x]` 时：

1. 宣布："所有任务已完成！"
2. 提示："是否归档此变更？运行 `/archive {name}` 进行归档。"

## 状态追踪

每个任务完成后记录到 `.fusion/status.json`：

```json
{
  "changeName": "my-feature",
  "startedAt": "2026-01-02T10:00:00Z",
  "tasks": {
    "1.1": { "status": "complete", "sha": "abc123", "completedAt": "..." },
    "1.2": { "status": "complete", "sha": "def456", "completedAt": "..." }
  }
}
```

## 下一步

- 完成后使用 `/archive {name}` 归档变更
- 随时使用 `/status` 查看进度
