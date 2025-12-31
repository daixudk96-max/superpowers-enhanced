# Skill: test-driven-development

## Purpose

Enforce test-first development practices based on Risk Tier, ensuring code quality and maintainability through systematic validation.

## When to Use

- Implementing any Tier 2-3 task
- Adding new features or fixing bugs
- Refactoring with behavioral changes
- **AUTOMATICALLY ACTIVATED** before any code edit to production files

## The TDD Cycle

```
┌─────────────────────────────────────────┐
│  1. RED    → Write failing test         │
│  2. GREEN  → Minimal code to pass       │
│  3. REFACTOR → Improve with tests green │
└─────────────────────────────────────────┘
```

## Risk Tier Classification

Before editing ANY file, determine its Risk Tier:

| Tier | File Types | Examples | Requirement |
|------|------------|----------|-------------|
| **0** | Documentation | `*.md`, `LICENSE`, `README` | None - proceed freely |
| **1** | Config/Styles | `*.json`, `*.css`, `*.yaml` | Log and proceed |
| **2** | General Code | `src/utils/*`, `components/*` | Test OR exemption required |
| **3** | Core Logic | `src/api/*`, `src/auth/*`, `**/core/**` | Strict test-first ONLY |

### Tier Detection Rules

```
Tier 0: \.md$, LICENSE, README, CHANGELOG, \.txt$
Tier 1: \.json$, \.ya?ml$, \.css$, \.scss$, \.env\.example$
Tier 3: /api/, /auth/, /core/, /security/, /payment/, /database/
Tier 2: Everything else (default)
```

## Pre-Edit Validation (Hook Logic)

**Before editing any file, YOU MUST:**

1. **Determine Risk Tier** of the target file

2. **For Tier 0-1**: Proceed with edit

3. **For Tier 2**: Check ONE of:
   - [ ] A failing test exists for this functionality
   - [ ] File contains `<!-- TDD-EXEMPT: reason="..." -->`
   - If neither: **STOP and write test first**

4. **For Tier 3**:
   - [ ] A failing test MUST exist
   - [ ] No exemptions allowed
   - If no failing test: **STOP and write test first**

## Test Quality Requirements

When writing tests, ensure:

### Reject These Patterns
- ❌ Empty test bodies: `it('should work', () => {})`
- ❌ Tests without assertions: `it('test', () => { doSomething(); })`
- ❌ Trivial assertions: `expect(true).toBe(true)`
- ❌ Self-referential: `expect(x).toBe(x)`

### Require These Patterns
- ✅ Meaningful assertions about behavior
- ✅ Setup → Action → Assert structure
- ✅ Edge case coverage
- ✅ Error handling tests

## Multi-Language Test Patterns

| Language | Test File Pattern | Assert Pattern |
|----------|-------------------|----------------|
| TypeScript | `*.test.ts`, `*.spec.ts` | `expect(x).toBe(y)` |
| JavaScript | `*.test.js`, `*.spec.js` | `expect(x).toEqual(y)` |
| Python | `test_*.py`, `*_test.py` | `assert x == y` |
| Go | `*_test.go` | `t.Error()`, `require.Equal()` |
| Rust | `#[cfg(test)]` | `assert_eq!()` |

## Steps for TDD Implementation

1. **Define behavior**: Write acceptance criteria in plain language
   ```markdown
   ## Acceptance Criteria
   - Given: [context]
   - When: [action]
   - Then: [expected result]
   ```

2. **Write failing test**: Express expected behavior as executable test
   ```typescript
   it('should return user when valid ID provided', () => {
     const user = getUser('123');
     expect(user.id).toBe('123');
     expect(user.name).toBeDefined();
   });
   ```

3. **Verify RED**: Run test, confirm it fails for the RIGHT reason
   ```bash
   npm test -- --grep "should return user"
   # Expected: FAIL - getUser is not defined
   ```

4. **Implement minimal**: Write just enough code to pass
   ```typescript
   function getUser(id: string): User {
     return { id, name: 'Test User' };
   }
   ```

5. **Verify GREEN**: Confirm test passes
   ```bash
   npm test -- --grep "should return user"
   # Expected: PASS
   ```

6. **Refactor**: Improve structure while keeping tests green

7. **Commit**: Include both test and implementation with task ID
   ```bash
   git commit -m "feat(user): add getUser function [Task 1.1]"
   ```

## Exemption Process

For Tier 2 tasks where TDD is impractical:

```markdown
<!-- TDD-EXEMPT: reason="Legacy code migration" approved-by="Tech Lead" date="2024-01-15" -->
```

**Valid exemption reasons:**
- Legacy code migration
- Generated/vendored code
- Configuration-only changes
- Emergency hotfix (must add test within 24h)

**Tier 3 tasks CANNOT be exempted.**

## Post-Edit Validation

After completing an edit:

1. **Run tests**: Confirm all tests pass
2. **Record SHA**: Note the commit hash for tracking
3. **Update tasks.md**: Mark task complete with SHA
   ```markdown
   - [x] 1.1 Add getUser function (sha: abc1234)
   ```

## Integration with Codex

When using Codex for implementation:

1. **Pre-implementation**: Ask Codex for test suggestions first
2. **Implementation**: Request code prototype as unified diff
3. **Post-implementation**: Have Codex review test coverage
