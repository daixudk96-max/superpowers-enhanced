# Context Templates

This directory contains context files that provide persistent project information to all Skills.

## Files

- `product.md` - Product description, target users, core features, KPIs
- `tech-stack.md` - Programming languages, frameworks, databases, tools
- `workflow.md` - Development process, branching strategy, CI/CD

## Usage

1. Run `/setup` to initialize these files with templates
2. Edit the files to match your project
3. Skills automatically read and use this context

## Template: product.md

```markdown
# Product Context

## Name
[Product name]

## Description
[One paragraph description]

## Target Users
- User type 1: [description]
- User type 2: [description]

## Core Features
1. Feature A
2. Feature B
3. Feature C

## Success Metrics (KPIs)
- Metric 1: [target]
- Metric 2: [target]
```

## Template: tech-stack.md

```markdown
# Tech Stack

## Languages
- Primary: [language + version]
- Secondary: [language + version]

## Frameworks
- Frontend: [framework]
- Backend: [framework]
- Testing: [framework]

## Data
- Database: [database]
- Cache: [cache]
- Search: [search engine]

## Infrastructure
- Cloud: [provider]
- CI/CD: [tool]
- Monitoring: [tool]
```

## Template: workflow.md

```markdown
# Workflow

## Branching Strategy
[Git Flow / GitHub Flow / Trunk-based]

- main: Production-ready
- develop: Integration branch
- feature/*: New features
- fix/*: Bug fixes

## Code Review
- Required approvals: [number]
- Auto-merge: [yes/no]

## CI/CD
- Build: [trigger conditions]
- Test: [test suite]
- Deploy: [environment]

## Release Process
1. [Step 1]
2. [Step 2]
3. [Step 3]
```
