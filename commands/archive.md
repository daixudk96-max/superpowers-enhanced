# /archive

Archive a completed change with metadata generation.

## Usage

```
/archive <change-name> [--yes] [--tag]
```

## Arguments

- `change-name` - The name of the change to archive
- `--yes` - Skip confirmation prompt (force archive even with incomplete tasks)
- `--tag` - Create a Git tag for the archive

## When to Use

- All tasks in the change are complete
- Ready to finalize and preserve the change history
- Before starting a new major change

## What You Will Do

1. **Verify the change exists** in `changes/<change-name>/`

2. **Check task completion** by parsing `tasks.md`:
   - Count tasks marked `[x]` (complete)
   - Count tasks marked `[ ]` (incomplete)
   - If incomplete tasks exist and `--yes` not provided, warn and abort

3. **Generate `metadata.json`** with this structure:
   ```json
   {
     "changeName": "<change-name>",
     "archivedAt": "<ISO timestamp>",
     "phases": [
       {
         "id": 1,
         "title": "Phase Title",
         "tasks": [
           {
             "id": "1.1",
             "description": "Task description",
             "status": "complete",
             "sha": "<git commit SHA if available>"
           }
         ]
       }
     ],
     "allCommits": [
       {
         "sha": "<commit SHA>",
         "message": "<commit message>",
         "timestamp": "<ISO timestamp>",
         "taskId": "1.1"
       }
     ],
     "revertInstructions": [
       "git revert --no-edit <sha1>",
       "git revert --no-edit <sha2>"
     ]
   }
   ```

4. **Move to archive directory**:
   - From: `changes/<change-name>/`
   - To: `changes/archive/YYYY-MM-DD-<change-name>/`

5. **Create Git tag** (if `--tag` specified):
   ```bash
   git tag -a archive/<change-name> -m "Archived change: <change-name>"
   ```

6. **Clean up Codex sessions** for this change (if any exist in `.fusion/codex-sessions.json`)

7. **Reset status tracking** in `.fusion/status.json`

## Completion

Report: "Archived to: `changes/archive/YYYY-MM-DD-<change-name>/`"

Include summary:
- Total tasks completed
- Total commits tracked
- Archive location
- Tag name (if created)

## Error Handling

- If change not found: "Change not found: `<change-name>`"
- If incomplete tasks without `--yes`: "X tasks still incomplete. Use `--yes` to force archive."
