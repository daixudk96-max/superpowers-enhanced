# Skill: subagent-driven-development

## Purpose

Delegate specialized tasks to subagents (including Codex) while maintaining overall coordination and quality control.

## When to Use

- Complex tasks that benefit from specialized handling
- Parallel workstreams that need coordination
- When Codex expertise adds value (algorithm optimization, bug hunting, etc.)

## Steps

1. **Task decomposition**: Break work into independent, parallelizable units
2. **Agent assignment**: Decide which tasks suit Codex (code details) vs. Claude Code (architecture)
3. **Context preparation**: Prepare clear, self-contained prompts for each subagent
4. **Delegation**: Invoke subagent with specific instructions
5. **Integration**: Collect outputs, resolve conflicts, integrate into main work
6. **Verification**: Review combined result for coherence and quality

## Agent Responsibilities

| Agent | Strengths | Use For |
|-------|-----------|---------|
| **Claude Code** | Architecture, planning, coordination | Design decisions, code structure, documentation |
| **Codex** | Code generation, debugging, optimization | Algorithm implementation, bug fixes, refactoring |

## Codex as Subagent

```typescript
// Delegate code implementation
mcp_codex_codex({
  PROMPT: "实现以下函数:\n\n{specification}\n\n要求:\n- 生成 unified diff\n- 包含单元测试",
  cd: "{project_root}",
  sandbox: "read-only",
  SESSION_ID: session.subagentSession
})
```

## Coordination Patterns

### Sequential Delegation
1. Claude Code: Design API interface
2. Codex: Implement functions
3. Claude Code: Review and integrate
4. Codex: Debug issues
5. Claude Code: Final verification

### Parallel Delegation
- Codex A: Implement module X
- Codex B: Implement module Y
- Claude Code: Integrate X + Y

## Quality Control

- Never accept subagent output blindly
- Question suggestions that seem off
- Run tests before integration
- Document subagent contributions for traceability
