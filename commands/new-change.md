# /new-change Command

Create a new change for tracking.

## Usage

```
/new-change <name>
```

## Description

Creates a new change directory with template files:
- `changes/{name}/proposal.md`
- `changes/{name}/tasks.md`
- `changes/{name}/specs/`

Also initializes status tracking in `.fusion/status.json`.

## Implementation

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { initializeStatus } from '../lib/task-status-tracker.js';

export async function newChangeCommand(name: string): Promise<void> {
  const changeDir = path.join('changes', name);
  
  // Check if change already exists
  if (fs.existsSync(changeDir)) {
    console.error(`Change already exists: ${name}`);
    return;
  }
  
  // Create directory structure
  fs.mkdirSync(path.join(changeDir, 'specs'), { recursive: true });
  
  // Create template files
  fs.writeFileSync(
    path.join(changeDir, 'proposal.md'),
    PROPOSAL_TEMPLATE.replace('{{name}}', name),
    'utf8'
  );
  
  fs.writeFileSync(
    path.join(changeDir, 'tasks.md'),
    TASKS_TEMPLATE,
    'utf8'
  );
  
  // Initialize status tracking
  initializeStatus(name);
  
  console.log(`✅ Created change: ${changeDir}`);
}

const PROPOSAL_TEMPLATE = `# Change: {{name}}

> Brief description

## Why

[Motivation]

## What Changes

[Description of changes]

## Impact

- Affected specs: 
- Affected code: 
`;

const TASKS_TEMPLATE = `## Phase 1: [Title]

- [ ] 1.1 [Task description]
- [ ] 1.2 [Task description]

## Phase 2: [Title]

- [ ] 2.1 [Task description]
`;
```
