# /setup

Initialize project context files for superpowers-fusion workflow.

## When to Use

Run this command at the start of a new project to set up the context directory structure.

## What You Will Do

1. **Create the `context/` directory** if it doesn't exist

2. **Create template files**:
   - `context/product.md` - Product description and user personas
   - `context/tech-stack.md` - Technology stack and dependencies
   - `context/workflow.md` - Development workflow and conventions

3. **Create the `changes/` directory** for change tracking

4. **Create the `.fusion/` directory** for runtime state (add to .gitignore)

## Template Content

### context/product.md
```markdown
# Product Context

## Product Name
[Your product name]

## Description
[Brief description of what your product does]

## Target Users
- [User persona 1]
- [User persona 2]

## Key Features
- [ ] Feature 1
- [ ] Feature 2
```

### context/tech-stack.md
```markdown
# Technology Stack

## Languages
- [Primary language]

## Frameworks
- [Framework name]

## Build Tools
- [Build tool]

## Testing
- [Test framework]
```

### context/workflow.md
```markdown
# Development Workflow

## Branch Strategy
- `main` - Production-ready code
- `feature/*` - Feature branches

## Commit Convention
- Use conventional commits (feat:, fix:, docs:, etc.)

## Code Review
- All changes require review before merge
```

## Completion

After running this command, confirm:
- [ ] `context/` directory exists with 3 template files
- [ ] `changes/` directory exists
- [ ] `.fusion/` directory exists and is in .gitignore

Report: "Context initialized. Edit the files in `context/` to customize for your project."
