# /revert

Revert to a previous state with three-level granularity.

## Usage

```
/revert                           # List archived changes
/revert change <name>             # Revert entire change
/revert phase <change> <n>        # Revert specific phase
/revert task <change> <id>        # Revert specific task
```

## When to Use

- Need to undo a completed change or part of it
- Something went wrong after archiving
- Want to rollback to a known good state

## What You Will Do

### List Mode (no arguments)

1. **Scan `changes/archive/`** for all archived changes
2. **Display list** sorted by date (newest first):
   ```
   Archived changes:
     - 2024-01-15-feature-auth (5 tasks, 8 commits)
     - 2024-01-10-bugfix-login (2 tasks, 3 commits)
   ```

### Change Revert

1. **Load `metadata.json`** from `changes/archive/<name>/`
2. **Check for ghost commits** (commits that may have been rebased):
   ```bash
   git cat-file -t <sha>  # Returns error if SHA doesn't exist
   ```
3. **Warn about ghost commits** if found:
   ```
   Warning: Ghost commits detected (may have been rebased):
     - abc1234
     - def5678
   ```
4. **Revert all commits in reverse order**:
   ```bash
   git revert --no-edit <sha_n>
   git revert --no-edit <sha_n-1>
   ...
   git revert --no-edit <sha_1>
   ```
5. **Report results**: "Reverted X commits from change `<name>`"

### Phase Revert

1. **Load `metadata.json`**
2. **Find phase by ID**
3. **Get all task SHAs for that phase**
4. **Revert only those commits** in reverse order
5. **Report**: "Reverted phase X: Y commits"

### Task Revert

1. **Load `metadata.json`**
2. **Find task by ID** (e.g., "1.1", "2.3")
3. **Get the task's SHA**
4. **Revert single commit**:
   ```bash
   git revert --no-edit <sha>
   ```
5. **Report**: "Reverted task X.Y"

## Ghost Commit Handling

When a commit SHA no longer exists (due to rebase/squash):

1. **Search for similar commit messages**:
   ```bash
   git log --oneline --grep="<original message>"
   ```
2. **Present options to user**:
   ```
   Original SHA abc1234 not found.
   Similar commits found:
     1. xyz7890 - "Similar commit message"
     2. Skip this commit
   ```
3. **Let user decide** how to proceed

## Error Handling

- Archive not found: "Archive not found: `<name>`"
- Phase not found: "Phase X not found in change `<name>`"
- Task not found: "Task X.Y not found in change `<name>`"
- Revert conflict: "Revert conflict in `<file>`. Resolve manually and run `git revert --continue`"

## Completion

Report summary:
- Number of commits reverted
- Any skipped ghost commits
- Current HEAD SHA after revert
