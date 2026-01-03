---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan

1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch

**Default: First 3 tasks**

For each task:

**2a. Pre-Implementation: Codex Prototype**

Before writing code, request a prototype:

```
mcp_codex_codex({
  PROMPT: "为 Task {taskId} 生成 unified diff patch:\n\n要求:\n1. {requirements}\n\n仅输出 diff，不实际修改文件",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.implementSession
})
```

**2b. Implementation**

1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. For Tier 2-3 tasks: Ensure test exists and fails first

**2c. Post-Implementation: Codex Review**

After implementation, request review:

```
mcp_codex_codex({
  PROMPT: "请审查以下代码改动:\n\n{diff}\n\n检查:\n1. 逻辑正确性\n2. 潜在 bug\n3. 与需求匹配度",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.reviewSession
})
```

**2d. Commit and Track**

1. Commit with descriptive message including task ID
2. Record SHA:

```typescript
// Record in .fusion/status.json
{
  "tasks": {
    "1.1": {
      "status": "complete",
      "sha": "abc123...",
      "completedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

3. Mark as completed

### Step 3: Report

When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue

Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

**Archive Trigger (if using OpenSpec):**

When all tasks marked complete:
1. Prompt user: "All tasks complete. Archive this change?"
2. If yes, invoke `/archive {change-name}`
3. Generate `metadata.json` with all commit SHAs
4. Move to `openspec/changes/archive/YYYY-MM-DD-{name}/`

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember

- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
- **Use Codex for prototype and review**
- **Track commit SHAs**
