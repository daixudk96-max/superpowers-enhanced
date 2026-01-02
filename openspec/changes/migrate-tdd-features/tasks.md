# Tasks: Migrate TDD-Guard Features

## Phase 1: Unified Test Schema & Jest Reporter

- [ ] **1.1** Define `UnifiedTestReport` interface in `lib/test-types.ts`
- [ ] **1.2** Update `FusionVitestReporter` to output `UnifiedTestReport` format
- [ ] **1.3** Add `reason` field computation in Vitest reporter
- [ ] **1.4** Create `lib/jest-reporter.ts` by adapting `tdd-guard/reporters/jest`
  - Adjust `Storage` import to use `.fusion/` directory
  - Modify output path to `.fusion/test-results.json`
- [ ] **1.5** Verify Jest reporter with existing tests (if any)

---

## Phase 2: Language Adapter Extension

- [ ] **2.1** Add PHP patterns to `LANGUAGE_PATTERNS` in `language-adapter.ts`
- [ ] **2.2** Add Storybook patterns to `LANGUAGE_PATTERNS`
- [ ] **2.3** Update `checkTestQuality()` to skip AST for PHP/Storybook
- [ ] **2.4** Add unit tests for new language detection

---

## Phase 3: ESLint Integration

- [ ] **3.1** Create `lib/eslint-runner.ts` (copy from `tdd-guard/src/linters/eslint/ESLint.ts`)
  - Adjust imports and type definitions
  - Use `.fusion/lint.json` for output
- [ ] **3.2** Add `LintResult` and `LintIssue` types to `lib/lint-types.ts`
- [ ] **3.3** Add ESLint configuration options to `.env.example`
- [ ] **3.4** Integrate lint check in `hooks/postToolEdit.ts`
  - Call after successful edit (not blocking initially)
  - Output warnings to console
- [ ] **3.5** Add blocking mode toggle (`TDD_LINT_BLOCK=true`)

---

## Phase 4: TDD Toggle Command

- [ ] **4.1** Create `src/cli/tdd-toggle.ts` with on/off/status actions
- [ ] **4.2** Implement `.fusion/config.json` read/write
- [ ] **4.3** Update `lib/config-loader.ts` to respect runtime override
- [ ] **4.4** Register command in `src/cli/index.ts`
- [ ] **4.5** Add help text and documentation

---

## Verification

- [ ] **V.1** Run `npm run typecheck` - no errors
- [ ] **V.2** Run `npm test` - existing tests pass
- [ ] **V.3** Manual test: Edit a TS file without test → should block
- [ ] **V.4** Manual test: `superpowers-fusion tdd-toggle off` → edits allowed
- [ ] **V.5** Manual test: ESLint warning appears after edit (if eslint installed)

---

## Out of Scope (Future Proposals)

- Pytest reporter (separate Python package)
- PHPUnit reporter (separate Composer package)
- Go reporter (separate Go module)
- Rust reporter (separate Cargo crate)
- Storybook reporter (separate npm package)
- golangci-lint integration
- Clippy integration
