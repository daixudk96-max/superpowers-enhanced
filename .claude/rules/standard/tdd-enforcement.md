## TDD (Test-Driven Development) - Mandatory Workflow

**Core Rule:** No production code without a failing test first. No exceptions.

### The Red-Green-Refactor Cycle

Follow this exact sequence for every feature, function, or behavior change:

#### 1. RED - Write Failing Test

Write one minimal test that describes the desired behavior.

**Test requirements:**
- Tests one specific behavior
- Has descriptive name: `test_<function>_<scenario>_<expected_result>`
- Uses real code (avoid mocks unless testing external dependencies)
- Focuses on behavior, not implementation details

#### 2. VERIFY RED - Confirm Test Fails

**MANDATORY STEP - Never skip this verification.**

Execute the test and verify:
- Test fails with expected failure message
- Fails because feature doesn't exist (not syntax errors or typos)
- Failure message clearly indicates what's missing

**If test passes:** You're testing existing behavior. Rewrite the test.
**If test errors:** Fix the error first, then re-run until it fails correctly.

#### 3. GREEN - Write Minimal Code

Write the simplest code that makes the test pass.

**Rules:**
- Implement only what the test requires
- No extra features or "improvements"
- No refactoring of other code
- Hardcoding is acceptable if it passes the test

#### 4. VERIFY GREEN - Confirm Test Passes

**MANDATORY STEP.**

Execute the test and verify:
- New test passes
- All existing tests still pass
- No errors or warnings in output

**If test fails:** Fix the implementation, not the test.
**If other tests fail:** Fix immediately before proceeding.

#### 5. REFACTOR - Improve Code Quality

Only after tests are green, improve code quality:
- Remove duplication
- Improve variable/function names
- Extract helper functions
- Simplify logic

**Critical:** Keep tests passing throughout refactoring. Re-run tests after each change.

**Do not add new behavior during refactoring.**

### Superpowers-Fusion Workflow Integration

When implementing features, follow this workflow:

1. **Use `/brainstorm`** to explore requirements before any implementation
2. **Use `/write-plan`** to create detailed implementation plan with tasks
3. **For each task in the plan:**
   - Write failing test first (RED)
   - Verify test fails
   - Implement minimal code (GREEN)
   - Verify all tests pass
   - Refactor if needed
4. **Use `/execute-plan`** to execute tasks in batches with review checkpoints

### When TDD Applies

**Always use TDD for:**
- New functions or methods
- New API endpoints
- New business logic
- Bug fixes (write test that reproduces bug first)
- Behavior changes

**TDD not required for:**
- Documentation-only changes
- Configuration file updates
- Dependency version updates
- Formatting/style-only changes

**When uncertain, use TDD.**

### Risk Tier Enforcement

Superpowers-Fusion enforces TDD based on Risk Tiers:

| Tier | Files | TDD Required |
|------|-------|--------------|
| 0 | README, LICENSE, docs | No |
| 1 | Config, styles, assets | No (logged) |
| 2 | Components, utilities | Yes (unless exemption) |
| 3 | Core API, auth, business logic | Yes (strict) |

**Tier 2/3 edits without failing tests will be blocked.**

### Exemption Comments

For legacy code or special cases, use exemption comments:
```typescript
// TDD-EXEMPT: Legacy code migration
```

### Verification Checklist

Before marking any implementation complete, verify:

- [ ] Every new function/method has at least one test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (missing feature, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass (executed and verified)
- [ ] Tests use real code (mocks only for external dependencies)
- [ ] Can explain why each test failed initially

**If any checkbox is unchecked, TDD was not followed. Start over.**
