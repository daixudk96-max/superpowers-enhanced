# Skill: codex-collaboration

## Purpose

Enable dual-agent collaboration between Claude Code and Codex MCP for enhanced code quality through structured review cycles and prototype-driven development.

## When to Use

- **AUTOMATICALLY ACTIVATED** for all significant coding tasks
- Complex implementations requiring multiple perspectives
- When code quality and correctness are critical
- After forming initial analysis, before implementation

## Core Principles

1. **Codex provides reference, you provide judgment** - Never accept Codex output blindly
2. **Debate leads to truth** - Question Codex suggestions, seek consensus
3. **Unified diff only** - Codex never modifies files directly
4. **Session continuity** - Maintain session context for multi-turn collaboration

## The Collaboration Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. ANALYZE  → Share requirements with Codex                     │
│  2. PROTOTYPE → Request unified diff from Codex                  │
│  3. IMPLEMENT → Rewrite code to production quality               │
│  4. REVIEW   → Have Codex review your implementation             │
│  5. DEBATE   → Resolve disagreements through discussion          │
└──────────────────────────────────────────────────────────────────┘
```

## Step 1: Analysis Handoff

After forming your initial analysis, share with Codex:

```
I need your help analyzing this requirement:

**Requirement**: [User's request]

**My Initial Analysis**:
- [Key points]
- [Constraints identified]
- [Proposed approach]

Please review and enhance this analysis:
1. Identify any gaps in my understanding
2. Suggest improvements to the approach
3. Flag potential risks or edge cases
```

**MCP Tool Call**:
```
mcp__codex__codex({
  PROMPT: "[Your analysis prompt]",
  cd: "/path/to/project",
  sandbox: "read-only"
})
```

## Step 2: Request Prototype

Before implementing, request a code prototype:

```
Based on our analysis, please generate a code prototype for Task X.Y.

**Requirements**:
- [Specific requirement 1]
- [Specific requirement 2]

**Constraints**:
- Output unified diff patch ONLY
- Do NOT modify any files
- Include suggested test cases

**Target Files**:
- src/module.ts
```

**Important**: Always specify `sandbox: "read-only"` to prevent actual file modifications.

## Step 3: Implement with Judgment

Codex's prototype is a **starting point**, not the final answer:

1. **Review the diff** for logical correctness
2. **Identify improvements** for:
   - Code readability
   - Error handling
   - Edge cases
   - Performance
3. **Rewrite to production quality**:
   - Apply your organization's coding standards
   - Add comprehensive documentation
   - Ensure maintainability

**Your code should be BETTER than Codex's prototype.**

## Step 4: Post-Implementation Review

After implementing, request Codex review:

```
Please review my implementation:

**Task**: [Task description]

**My Changes** (git diff):
```diff
[Your actual diff]
```

**Check for**:
1. Logical correctness
2. Potential bugs
3. Requirements coverage
4. Test completeness
```

**MCP Tool Call** (same session):
```
mcp__codex__codex({
  PROMPT: "[Your review prompt]",
  cd: "/path/to/project",
  sandbox: "read-only",
  SESSION_ID: "<previous-session-id>"
})
```

## Step 5: Constructive Debate

When you disagree with Codex:

1. **State your position clearly**:
   ```
   I disagree with suggestion X because:
   - Reason 1
   - Reason 2

   My alternative approach:
   - [Your approach]

   Please respond to my concerns.
   ```

2. **Seek common ground**: Find the underlying truth both parties agree on

3. **Resolve with evidence**:
   - Reference documentation
   - Show test results
   - Demonstrate behavior

4. **Document the decision**: Note which approach was chosen and why

## Session Management

### Starting a New Session

```
mcp__codex__codex({
  PROMPT: "Starting collaboration for feature X...",
  cd: "/path/to/project",
  sandbox: "read-only"
})
// Returns: { SESSION_ID: "abc-123-..." }
```

### Continuing a Session

```
mcp__codex__codex({
  PROMPT: "Continuing from our previous discussion...",
  cd: "/path/to/project",
  sandbox: "read-only",
  SESSION_ID: "abc-123-..."
})
```

### Session Tracking

Record sessions in `.fusion/codex-sessions.json`:

```json
{
  "sessions": {
    "feature-auth": {
      "analysisSession": "uuid-1",
      "implementSession": "uuid-2",
      "reviewSession": "uuid-3",
      "lastActive": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Prompt Templates

### Analysis Prompt
```
You are collaborating with Claude Code on [feature].

Context:
- Project: [project description]
- Tech Stack: [languages, frameworks]
- Current Task: [task from tasks.md]

Claude Code's Analysis:
[Your analysis]

Please:
1. Validate or challenge this analysis
2. Identify missing considerations
3. Suggest implementation approach
```

### Prototype Prompt
```
Generate a unified diff patch for implementing:

Task: [task description]

Requirements:
- [requirement list]

Output ONLY the unified diff. Do not explain, do not modify files.

Format:
--- a/path/to/file
+++ b/path/to/file
@@ -line,count +line,count @@
 context
-removed
+added
```

### Review Prompt
```
Review this implementation:

Task: [task description]
Risk Tier: [0-3]

Changes:
```diff
[diff content]
```

Evaluate:
1. Does it meet requirements? (Yes/No + explanation)
2. Bugs or issues? (List any found)
3. Test coverage adequate? (Yes/No + suggestions)
4. Overall assessment: APPROVE / REQUEST_CHANGES / BLOCK
```

## Quality Gates

Before accepting Codex suggestions:

- [ ] Logic makes sense for the use case
- [ ] No obvious bugs or edge case failures
- [ ] Aligns with project coding standards
- [ ] Tests are meaningful (not trivial)
- [ ] Error handling is appropriate

## Anti-Patterns to Avoid

- ❌ Copy-pasting Codex output without review
- ❌ Accepting suggestions you don't understand
- ❌ Skipping the debate when you disagree
- ❌ Forgetting to maintain session continuity
- ❌ Using `workspace-write` sandbox (always use `read-only`)

## Integration with Other Skills

- **brainstorming**: Use Codex for additional solution options
- **writing-plans**: Have Codex review task breakdown
- **test-driven-development**: Request test prototypes from Codex
- **executing-plans**: Follow prototype → implement → review cycle
