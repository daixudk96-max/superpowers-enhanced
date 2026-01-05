---
name: creating-changes
description: 创建新变更目录和任务模板
---

# Creating Changes

## 概述

当需要开始一个新功能、修复或重构时，先创建变更目录。

**Announce at start:** "I'm using the creating-changes skill to scaffold a new change."

## 何时使用

- 头脑风暴完成后
- 有明确的变更目标和名称

## 前提条件

确保具备以下条件：
1. 已完成 brainstorming，明确了变更目标
2. 有一个 kebab-case 格式的变更名称 (如 `add-user-auth`)
3. 了解变更的影响范围

## 流程

### Step 1: 确定变更名称

命名规范：
- 使用 kebab-case (小写 + 横杠)
- 动词开头：`add-`, `update-`, `remove-`, `refactor-`
- 简短描述性：`add-user-auth`, `fix-login-bug`

### Step 2: 运行命令

**REQUIRED COMMAND:** `/new-change {name}`

这将创建：
```
changes/{name}/
├── proposal.md    # 变更概述
├── tasks.md       # 任务清单
└── design.md      # 技术设计 (可选)
```

### Step 3: 确认创建

检查目录是否创建成功：
- `changes/{name}/` 目录存在
- `.fusion/status.json` 已更新 `changeName`

## 下一步

命令执行完成后：

**REQUIRED SUB-SKILL:** Use superpowers:writing-plans 编写任务计划
