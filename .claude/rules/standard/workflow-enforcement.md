# Workflow Enforcement Rules

**Rule:** Follow the `/brainstorm` → `/write-plan` → `/execute-plan` workflow exactly. No shortcuts.

## Brainstorm-WritePlan-Execute Lifecycle

The project uses a three-phase workflow that must be followed strictly:

| Phase | Command | Purpose | Next Action |
|-------|---------|---------|-------------|
| Brainstorm | `/brainstorm` | Explore requirements and design | Create plan with `/write-plan` |
| Planning | `/write-plan` | Create detailed implementation plan | Execute with `/execute-plan` |
| Execution | `/execute-plan` | Implement tasks in batches | Verify and archive |

## Mandatory Task Completion Tracking

**After completing EACH task during execution, you MUST:**

1. **Edit the tasks.md file immediately** - Change `[ ]` to `[x]` for the completed task
2. **Update Progress Tracking counts** - Increment Completed, decrement Remaining
3. **Do NOT proceed to next task** until checkbox is updated

**This applies to EVERY task, not just at the end of implementation.**

### Valid Task Progress Tracking

```markdown
## Progress Tracking

- [x] Task 1: Create package structure
- [x] Task 2: Implement UI layer
- [/] Task 3: Implement context module  ← Currently implementing
- [ ] Task 4: Add error handling

**Total Tasks:** 4 | **Completed:** 2 | **Remaining:** 2
```

### Invalid (What NOT to Do)

```markdown
## Progress Tracking

- [ ] Task 1: Create package structure  ← WRONG: Task done but not checked
- [ ] Task 2: Implement UI layer        ← WRONG: Task done but not checked
- [x] Task 3: Implement context module
- [ ] Task 4: Add error handling

**Total Tasks:** 4 | **Completed:** 1 | **Remaining:** 3  ← WRONG: Counts don't match
```

## OpenSpec Integration

When using OpenSpec for change management:

1. **Use `/new-change`** to scaffold a new change proposal
2. **Review `proposal.md`** for scope and impact
3. **Follow `tasks.md`** for implementation order
4. **Use `/archive`** when change is complete and verified

### Change Status Values

- `PENDING` - Change proposed, awaiting implementation
- `IN_PROGRESS` - Currently being implemented
- `COMPLETE` - All tasks implemented
- `ARCHIVED` - Deployed and verified

## Phase Completion Verification

**Trigger:** This protocol is executed immediately after a task is completed that also concludes a phase.

1. **Announce Protocol Start:** Inform the user that the phase is complete
2. **Run Automated Tests:** Execute `npm run test` and verify all pass
3. **Manual Verification:** Present verification steps to the user
4. **Await User Feedback:** Ask for confirmation before proceeding
5. **Create Checkpoint:** Use `/archive` to create checkpoint commit

## Quality Gates

Before marking any task complete, verify:

- [ ] All tests pass
- [ ] Code follows project's code style guidelines
- [ ] All public functions/methods are documented
- [ ] Type safety is enforced
- [ ] No linting errors
- [ ] Documentation updated if needed

## Common Violations and Fixes

| Violation | Symptom | Fix |
|-----------|---------|-----|
| Forgot to update checkbox | `[ ]` on completed task | Edit tasks.md, change to `[x]` |
| Wrong counts | Completed + Remaining ≠ Total | Recount and update |
| Skipped brainstorm | Jumped directly to coding | Stop, run `/brainstorm` first |
| No failing test | Wrote code before test | Delete code, write test first |
| Tasks out of order | Implemented later tasks first | Follow task order strictly |

## Enforcement Protocol

**If workflow violations detected:**

1. **STOP** - Do not proceed
2. **Report** - List all violations found
3. **Fix** - Update task files with correct checkboxes, counts
4. **Re-verify** - Run verification again

**Violations are blocking** - The workflow cannot proceed until fixed.

## Quick Reference

| When | Command | Action |
|------|---------|--------|
| Starting new feature | `/brainstorm` | Explore requirements |
| Creating implementation plan | `/write-plan` | Create task list |
| Executing tasks | `/execute-plan` | Implement in batches |
| Completing a change | `/archive` | Create checkpoint |
| Proposing a change | `/new-change` | Scaffold proposal |
