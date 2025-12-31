# Skill: writing-plans

## Purpose

Produce an executable, phase-structured plan with explicit risk tiers and Codex collaboration points.

## When to Use

- After brainstorming a direction
- Before any implementation or refactor
- When risk or scope needs explicit control

## Steps

1. **Context intake**: Goals, constraints, repos, environments, deadlines
2. **Codex collaboration**: Ask Codex for requirement analysis and edge cases; incorporate feedback
3. **Phase structuring**: Break work into Phases → Tasks → Subtasks; mark dependencies
4. **Risk tier assignment**: Label each task with Risk Tier (0-3)
5. **Acceptance criteria**: Define clear success conditions per task
6. **Output**: Generate `proposal.md` and `tasks.md` in `changes/{change-name}/`

## Risk Tiers

| Tier | Description | TDD Requirement |
|------|-------------|-----------------|
| **0** | Always allowed (docs, comments, .gitignore) | None |
| **1** | Allowed with logging (CSS, renames) | None, logged |
| **2** | Require failing test OR exemption | Test or exemption |
| **3** | Strict TDD (core logic, new features) | Mandatory test first |

## Phase Structure Format

```markdown
## Phase 1: [Phase Title]

- [ ] 1.1 [Task description] <!-- Risk: Tier-X -->
  - [ ] 1.1.1 [Subtask]
  - [ ] 1.1.2 [Subtask]
- [ ] 1.2 [Task description] <!-- Risk: Tier-X -->

## Phase 2: [Phase Title]
...
```

## Codex Collaboration

After initial analysis, invoke Codex to validate and enhance:

```
mcp_codex_codex({
  PROMPT: "请分析以下需求，识别边界情况和潜在风险:\n\n{needs}",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.planningSession  // continue conversation
})
```

## Output Artifacts

- `changes/{name}/proposal.md` - Why, What, Impact
- `changes/{name}/tasks.md` - Phase-structured task list
- `changes/{name}/specs/` - Detailed specifications (if needed)
