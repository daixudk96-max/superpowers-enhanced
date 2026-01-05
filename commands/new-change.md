# /new-change

Create a new change for structured development tracking.

## Usage

```
/new-change <name>
```

## Arguments

- `name` - A short, descriptive name for the change (use-kebab-case)

## When to Use

- Starting a new feature, bug fix, or refactoring effort
- When you want to track progress with phases and tasks
- Before beginning any significant code changes

## What You Will Do

1. **Verify the change doesn't already exist** in `changes/<name>/`

2. **Create the change directory structure**:
   ```
   changes/<name>/
   ├── proposal.md      # Why and what
   ├── tasks.md         # Phased task breakdown
   └── specs/           # Detailed specifications
   ```

3. **Create `proposal.md`** with this template:
   ```markdown
   # Change: <name>

   > Brief one-line description

   ## Why

   [Motivation for this change - what problem does it solve?]

   ## What Changes

   [High-level description of what will be modified]

   ## Impact

   - **Affected specs**: [List any spec files]
   - **Affected code**: [List key files/modules]
   - **Risk tier**: [0-3, see TDD skill for definitions]

   ## Success Criteria

   - [ ] Criterion 1
   - [ ] Criterion 2
   ```

4. **Create `tasks.md`** with this template:
   ```markdown
   # Tasks: <name>

   ## Phase 1: [Phase Title]

   - [ ] 1.1 [Task description - keep to 2-5 minutes of work]
   - [ ] 1.2 [Task description]

   ## Phase 2: [Phase Title]

   - [ ] 2.1 [Task description]
   - [ ] 2.2 [Task description]

   ---

   **Legend**:
   - `[ ]` = Pending
   - `[x]` = Complete
   - `[~]` = In Progress
   - `[-]` = Skipped
   ```

5. **Initialize status tracking** in `.fusion/status.json`:
   ```json
   {
     "currentChange": "<name>",
     "startedAt": "<ISO timestamp>",
     "tasks": {}
   }
   ```

## Completion

Report: "Created change: `changes/<name>/`. Edit `proposal.md` to define the change, then break down work in `tasks.md`."

## Next Steps (Integrated Workflow)

After creating the change, follow this workflow:

1. **Fill in `proposal.md`** with the change details
2. **Invoke the writing-plans skill** to break down the work into phased tasks
   - This replaces the need for a separate `/write-plan` command
   - The skill guides you through creating detailed, time-boxed tasks
3. **Begin execution** with `/execute-plan` or use the executing-plans skill
4. **Archive on completion** with `/archive <name>`

## Integration with TDD

For changes with code modifications:
- Each task should be time-boxed (2-5 minutes of work)
- Tests must be written/verified before implementation code
- Risk tier in `proposal.md` determines TDD enforcement level

## 执行

变更目录创建后：

**REQUIRED SUB-SKILL:** Use superpowers:writing-plans 编写任务计划


