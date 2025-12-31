# Skill: executing-plans

## Purpose

Implement tasks from a plan with Git SHA tracking, Codex code review, and archive triggering.

## When to Use

- After `writing-plans` produces an approved plan
- When working through `tasks.md` items sequentially

## Steps

1. **Load plan**: Read `changes/{name}/tasks.md`, identify next uncompleted task
2. **Pre-implementation**: Request Codex code prototype (unified diff only)
3. **Implement**: Write production-grade code based on prototype
4. **Test**: Run tests, ensure TDD compliance per Risk Tier
5. **Codex review**: Request Codex code review, incorporate feedback
6. **Commit**: Commit with descriptive message including task ID
7. **Track SHA**: Record commit SHA in `.fusion/status.json`
8. **Update task**: Mark task complete in `tasks.md`
9. **Archive check**: If all tasks complete, trigger archive prompt

## Pre-Implementation: Codex Prototype

Before writing code, request a prototype:

```typescript
mcp_codex_codex({
  PROMPT: "为 Task {taskId} 生成 unified diff patch:\n\n要求:\n1. {requirements}\n\n仅输出 diff，不实际修改文件",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.implementSession
})
```

## Post-Implementation: Codex Review

After implementation, request review:

```typescript
mcp_codex_codex({
  PROMPT: "请审查以下代码改动:\n\n{diff}\n\n检查:\n1. 逻辑正确性\n2. 潜在 bug\n3. 与需求匹配度",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.reviewSession
})
```

## Git SHA Tracking

On task completion:

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

## Archive Trigger

When all tasks marked complete:

1. Prompt user: "All tasks complete. Archive this change?"
2. If yes, invoke `/archive {change-name}`
3. Generate `metadata.json` with all commit SHAs
4. Move to `changes/archive/YYYY-MM-DD-{name}/`
