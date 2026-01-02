# Tasks

## Phase 1: Core Module

- [x] 1.1 Create `lib/doc-sync.ts` with type definitions <!-- Risk: Tier-2 -->
  - Define `DocSyncOptions`, `DocUpdate` interfaces
  - Create async `syncContextDocs()` function signature

- [x] 1.2 Implement LLM-based analysis <!-- Risk: Tier-3 -->
  - Read proposal.md and specs/ from change directory
  - Read context documents (product.md, tech-stack.md, workflow.md)
  - Call LLM via `api-client.ts` to generate update suggestions
  - Parse LLM response into `DocUpdate[]`

- [x] 1.3 Implement diff formatting and application <!-- Risk: Tier-2 -->
  - `formatDiffs()` - Generate unified diff for display
  - `applyDocUpdates()` - Write updates to files

## Phase 2: Archive Integration

- [x] 2.1 Add `--skip-docs` CLI option to `archive.ts` <!-- Risk: Tier-2 -->

- [x] 2.2 Integrate doc-sync into archive workflow <!-- Risk: Tier-3 -->
  - Call `syncContextDocs()` before checkpoint commit
  - Display diffs and prompt user for confirmation
  - Apply updates on confirmation

## Phase 3: Testing

- [x] 3.1 Unit tests for `lib/doc-sync.ts` <!-- Risk: Tier-2 -->
  - 7 test cases covering formatDiffs, applyDocUpdates, and syncContextDocs edge cases

- [x] 3.2 Update CLAUDE.md <!-- Risk: Tier-1 -->
