# Spec: doc-sync

> Document synchronization capability for the archive command

## ADDED Requirements

### REQ-DOCSYNC-001: Change Insight Extraction

The system shall extract structured insights from completed change documents.

#### Scenario: Parse proposal with standard sections

**Given** a change directory containing `proposal.md` with `## What Changes` and `## Impact` sections  
**When** `collectChangeInsights()` is called  
**Then** features, techStack, and workflow arrays are populated from relevant sections

#### Scenario: Handle missing proposal

**Given** a change directory without `proposal.md`  
**When** `collectChangeInsights()` is called  
**Then** return empty insights with `rawProposal: ""`

---

### REQ-DOCSYNC-002: Context Document Snapshot

The system shall read and parse existing context documents for comparison.

#### Scenario: Snapshot existing context

**Given** a context directory with `product.md`, `tech-stack.md`, `workflow.md`  
**When** `snapshotContext()` is called  
**Then** return snapshot with parsed sections for each document

#### Scenario: Handle missing context file

**Given** a context directory missing `workflow.md`  
**When** `snapshotContext()` is called  
**Then** workflow entry is `null` and other documents are still parsed

---

### REQ-DOCSYNC-003: Update Suggestion Generation

The system shall compare change insights with context snapshot and generate update suggestions.

#### Scenario: Generate update for new feature

**Given** insights containing a new feature not in `product.md`  
**When** `buildDocUpdates()` is called  
**Then** return `DocUpdate` with updated `product.md` content including the new feature

#### Scenario: No updates needed

**Given** insights that match existing context content  
**When** `buildDocUpdates()` is called  
**Then** return empty array

---

### REQ-DOCSYNC-004: Diff Formatting

The system shall generate human-readable diffs for user review.

#### Scenario: Format unified diff

**Given** a `DocUpdate` array with one changed file  
**When** `formatDiffs()` is called  
**Then** return unified diff string showing additions and deletions

---

### REQ-DOCSYNC-005: Archive Integration

The archive command shall integrate document synchronization before archiving.

#### Scenario: Default sync behavior

**Given** user runs `/archive change-name` without flags  
**When** the archive process starts  
**Then** document sync is attempted before checkpoint commit

#### Scenario: Skip sync with flag

**Given** user runs `/archive change-name --skip-docs`  
**When** the archive process starts  
**Then** document sync is skipped entirely

#### Scenario: User confirmation workflow

**Given** document updates are suggested  
**When** diffs are displayed to user  
**Then** user can confirm (apply) or decline (skip) updates

---

## Cross-references

- **archive**: This capability extends the existing archive command
- **context management**: Syncs with context/ directory managed by /setup command
