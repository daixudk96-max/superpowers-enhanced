---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md` or `openspec/changes/<id>/tasks.md`

## Codex Collaboration

Before drafting the plan, invoke Codex for requirement analysis:

```
mcp_codex_codex({
  PROMPT: "请分析以下需求，识别边界情况和潜在风险:\n\n{requirements}",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.planningSession
})
```

Incorporate Codex feedback into the plan structure.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Risk Tier Assignment

Label each task with Risk Tier (0-3):

| Tier | Description | TDD Requirement |
|------|-------------|-----------------|
| **0** | Always allowed (docs, comments, .gitignore) | None |
| **1** | Allowed with logging (CSS, renames) | None, logged |
| **2** | Require failing test OR exemption | Test or exemption |
| **3** | Strict TDD (core logic, new features) | Mandatory test first |

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

```markdown
### Task N: [Component Name] <!-- Risk: Tier-X -->

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits
- **Risk Tier on every task**

## Execution Handoff

计划完成后：

### Step 1: 用户审阅

"计划已保存。请审阅计划内容。

审阅完成后回复 'ok' 继续。"

⚠️ **必须等待用户确认后才继续**

### Step 2: 创建 Worktree

用户确认后：

"正在创建隔离工作环境..."

**REQUIRED SUB-SKILL:** Use superpowers:using-git-worktrees

### Step 3: 选择执行方式

Worktree 就绪后询问：

"请选择执行方式：

**1. Subagent-Driven (本会话)** → superpowers:subagent-driven-development
**2. Sequential (当前 Agent)** → superpowers:executing-plans

请选择 1 或 2。"

**If Subagent-Driven (1) chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Sequential (2) chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Execute tasks in batches with checkpoints

## Output Artifacts

When using OpenSpec workflow:
- `openspec/changes/{name}/proposal.md` - Why, What, Impact
- `openspec/changes/{name}/tasks.md` - Phase-structured task list
- `openspec/changes/{name}/specs/` - Detailed specifications (if needed)

