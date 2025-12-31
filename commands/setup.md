# /setup Command

Initialize context files for the project.

## Usage

```
/setup
```

## Description

Creates the `context/` directory with template files:
- `product.md` - Product and user information
- `tech-stack.md` - Technology stack details
- `workflow.md` - Development workflow

## Implementation

```typescript
import fs from 'node:fs';
import path from 'node:path';

export async function setupCommand(projectDir: string): Promise<void> {
  const contextDir = path.join(projectDir, 'context');
  
  // Create context directory
  fs.mkdirSync(contextDir, { recursive: true });
  
  // Create template files
  const templates = {
    'product.md': PRODUCT_TEMPLATE,
    'tech-stack.md': TECH_STACK_TEMPLATE,
    'workflow.md': WORKFLOW_TEMPLATE,
  };
  
  for (const [filename, content] of Object.entries(templates)) {
    const filepath = path.join(contextDir, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, content, 'utf8');
    }
  }
  
  console.log('✅ Context files initialized in context/');
}
```

## Templates

See `context/README.md` for template content.
