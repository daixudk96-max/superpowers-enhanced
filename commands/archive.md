# /archive Command

Archive a completed change with metadata generation.

## Usage

```
/archive <change-name> [--yes]
```

## Description

Archives a completed change from `changes/{name}/` to `changes/archive/YYYY-MM-DD-{name}/`:

1. Verifies all tasks are complete
2. Generates `metadata.json` with commit SHAs
3. Moves files to archive directory
4. Creates Git tag (optional)

## Implementation

```typescript
import { archiveChange } from '../lib/archive-manager.js';
import { allTasksComplete } from '../lib/task-status-tracker.js';
import { cleanupSessionsForChange } from '../lib/codex-session.js';

export async function archiveCommand(
  changeName: string,
  options: { yes?: boolean }
): Promise<void> {
  const changesDir = 'changes';
  const sourceDir = `${changesDir}/${changeName}`;
  
  // Verify source exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Change not found: ${changeName}`);
    return;
  }
  
  // Confirm unless --yes
  if (!options.yes) {
    const confirm = await prompt(`Archive ${changeName}? (y/n)`);
    if (confirm !== 'y') return;
  }
  
  // Archive
  const archivePath = await archiveChange(changeName, sourceDir);
  
  // Cleanup Codex sessions
  cleanupSessionsForChange(changeName);
  
  console.log(`✅ Archived to: ${archivePath}`);
}
```

## Output

- `changes/archive/YYYY-MM-DD-{name}/`
  - `proposal.md`
  - `tasks.md`
  - `specs/`
  - `metadata.json` (generated)
