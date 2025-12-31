# Skill: test-driven-development

## Purpose

Enforce test-first development practices based on Risk Tier, ensuring code quality and maintainability.

## When to Use

- Implementing any Tier 2-3 task
- Adding new features or fixing bugs
- Refactoring with behavioral changes

## The TDD Cycle

```
┌─────────────────────────────────────────┐
│  1. RED    → Write failing test         │
│  2. GREEN  → Minimal code to pass       │
│  3. REFACTOR → Improve with tests green │
└─────────────────────────────────────────┘
```

## Steps

1. **Define behavior**: Write acceptance criteria in plain language
2. **Write failing test**: Express expected behavior as executable test
3. **Verify RED**: Confirm test fails for the RIGHT reason
4. **Implement minimal**: Write just enough code to pass
5. **Verify GREEN**: Confirm test passes
6. **Refactor**: Improve structure while keeping tests green
7. **Commit**: Include both test and implementation

## Risk Tier Compliance

| Tier | Requirement | Hook Behavior |
|------|-------------|---------------|
| 0 | None | Pass through |
| 1 | None, logged | Log and pass |
| 2 | Test OR exemption | Block without test |
| 3 | Strict test-first | Block without failing test |

## Test Quality Requirements

The system will reject:
- ❌ Empty test bodies
- ❌ Tests without assertions
- ❌ Trivial assertions (`expect(true).toBe(true)`)

## Multi-Language Support

| Language | Test Pattern | Framework |
|----------|--------------|-----------|
| TypeScript | `*.test.ts`, `*.spec.ts` | Jest, Vitest |
| JavaScript | `*.test.js`, `*.spec.js` | Jest, Mocha |
| Python | `test_*.py`, `*_test.py` | pytest |
| Go | `*_test.go` | testing |
| Rust | `#[cfg(test)]` | cargo test |

## Exemption Process

For Tier 2 tasks without test:

```markdown
<!-- TDD-EXEMPT: reason="..." approved-by="..." -->
```

Tier 3 tasks cannot be exempted.
