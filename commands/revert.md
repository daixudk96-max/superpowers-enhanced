# /revert Command

Revert to a previous state with three-level granularity.

## Usage

```
/revert                          # List archived changes
/revert change <name>            # Revert entire change
/revert phase <change> <n>       # Revert specific phase
/revert task <change> <id>       # Revert specific task
```

## Description

Uses Git SHA tracking in `metadata.json` to perform accurate reverts.

### Change Revert
Reverts all commits associated with a change in reverse order.

### Phase Revert
Reverts all tasks within a specific phase.

### Task Revert
Reverts a single task's commit.

## Implementation

```typescript
import { revertChange, checkGhostCommits } from '../lib/revert-handler.js';
import { listArchivedChanges, loadArchiveMetadata } from '../lib/archive-manager.js';

export async function revertCommand(args: string[]): Promise<void> {
  const changesDir = 'changes';
  
  // No args: list archives
  if (args.length === 0) {
    const archives = listArchivedChanges(changesDir);
    console.log('Archived changes:');
    archives.forEach(a => console.log(`  - ${a}`));
    return;
  }
  
  const [level, ...rest] = args;
  
  switch (level) {
    case 'change': {
      const [name] = rest;
      const result = await revertChange(changesDir, name, 'change');
      console.log(`Reverted ${result.revertedCommits.length} commits`);
      break;
    }
    case 'phase': {
      const [name, phaseId] = rest;
      const result = await revertChange(changesDir, name, 'phase', parseInt(phaseId));
      console.log(`Reverted phase ${phaseId}: ${result.revertedCommits.length} commits`);
      break;
    }
    case 'task': {
      const [name, taskId] = rest;
      const result = await revertChange(changesDir, name, 'task', taskId);
      console.log(`Reverted task ${taskId}`);
      break;
    }
  }
}
```

## Ghost Commit Handling

If commits have been rebased/squashed:
1. Detect missing SHAs
2. Search for similar commit messages
3. Prompt user for confirmation

```typescript
const ghosts = checkGhostCommits(metadata);
if (ghosts.length > 0) {
  console.warn('⚠️ Ghost commits detected (may have been rebased):');
  ghosts.forEach(sha => console.warn(`  - ${sha}`));
}
```
