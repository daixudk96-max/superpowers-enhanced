# Activation Plan: TDD Features

## 1. Environment Setup
- Create `.env` from `.env.example`.
- Set `TDD_VALIDATION_ENABLED=true`.
- Set `TDD_VALIDATION_CLIENT=sdk` (default).
- Set `TDD_AST_CHECKS_ENABLED=true`.

## 2. Refactor Hooks for Async Support
- Update `hooks/preToolEdit.ts` to return `Promise<PreToolEditResult>`.
- Update `hooks/index.ts` to export the async function.
- Verify `src/cli/init.ts` (if applicable) handles the async hook correctly.

## 3. Implement AI Validation (`preToolEdit.ts`)
- Import `validateWithAI` from `lib/api-client.ts`.
- In `preToolEdit`:
  - Determine Risk Tier.
  - If Tier 0/1: Allow.
  - If Tier 2/3:
    - Check `shouldBlockEdit`.
    - If blocked:
      - Call `validateWithAI({ context: ..., filePath: ..., content: ... })`.
      - If AI returns "approve", ALLOW with `reason` and `logged: true`.
      - If AI returns "block", BLOCK with reason.

## 4. Implement AST Quality Checks
- In `preToolEdit.ts` (or `postToolEdit.ts` if better suited, but User Plan says "Activating AST Check"):
  - If `isTestFile(filePath)` AND `config.tdd.astChecks`:
    - Call `checkTestQuality`.
    - If quality issues found:
      - Warning mode: Log issues but allow.
      - strict mode: Block edits if critical issues (empty tests).

## 5. Implement Test Result Persistence
- In `hooks/postToolEdit.ts`:
  - When `testsPassing` is determined, save it to `.fusion/test-status.json`.
- In `hooks/preToolEdit.ts`:
  - Load `.fusion/test-status.json` to populate `hasFailingTest` for `shouldBlockEdit`.

## 6. Verification
- Run `npm test`.
- Manually test by editing a file to trigger AI validation (Tier 2/3).
