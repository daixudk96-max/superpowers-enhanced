# Workflow

## Branching Strategy

[Choose: Git Flow / GitHub Flow / Trunk-based]

| Branch | Purpose |
|--------|---------|
| main | Production-ready code |
| develop | Integration branch |
| feature/* | New features |
| fix/* | Bug fixes |
| release/* | Release preparation |

## Code Review

- **Required Approvals**: [number]
- **Auto-merge**: [yes/no]
- **Required Checks**: [tests, lint, build]

## CI/CD Pipeline

### On Pull Request

1. Run tests
2. Run linters
3. Build check

### On Merge to Main

1. Run full test suite
2. Build production bundle
3. Deploy to staging
4. [Manual approval for prod]

## Release Process

1. Create release branch from develop
2. Update version and changelog
3. Merge to main
4. Tag release
5. Deploy to production
