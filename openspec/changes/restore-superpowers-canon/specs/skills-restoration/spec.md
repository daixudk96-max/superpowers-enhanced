# Spec: Skills Restoration

## MODIFIED Requirements

### Skills SKILL.md Content Completeness

> Skills 的 SKILL.md 文件必须包含原版 obra/superpowers 的完整内容。

#### Scenario: Verify test-driven-development SKILL.md contains complete content

**Given** the file `skills/test-driven-development/SKILL.md` exists
**When** comparing with the original `superpowers/skills/test-driven-development/SKILL.md`
**Then** the Fusion version MUST contain all content from the original version
**And** the Fusion version MAY contain additional "Fusion 扩展" sections at the end

#### Scenario: Verify brainstorming SKILL.md contains complete content

**Given** the file `skills/brainstorming/SKILL.md` exists
**When** comparing with the original `superpowers/skills/brainstorming/SKILL.md`
**Then** the Fusion version MUST contain all content from the original version
**And** the file MUST include YAML frontmatter with `name` and `description` fields

#### Scenario: Verify writing-plans SKILL.md contains execution handoff options

**Given** the file `skills/writing-plans/SKILL.md` exists
**When** reading the file content
**Then** the file MUST contain "Subagent-Driven" execution option
**And** the file MUST contain "Parallel Session" execution option
**And** the file MUST reference `superpowers:executing-plans`
**And** the file MUST reference `superpowers:subagent-driven-development`

---

### Sub-skill Reference Chain Integrity

> Skills 必须保留原版的子技能引用链，确保工作流自动调用。

#### Scenario: Verify executing-plans references finishing skill

**Given** the file `skills/executing-plans/SKILL.md` exists
**When** searching for sub-skill references
**Then** the file MUST contain `superpowers:finishing-a-development-branch` reference

#### Scenario: Verify brainstorming references downstream skills

**Given** the file `skills/brainstorming/SKILL.md` exists
**When** searching for sub-skill references
**Then** the file MUST contain `superpowers:using-git-worktrees` reference
**And** the file MUST contain `superpowers:writing-plans` reference

#### Scenario: Verify subagent-driven-development references TDD skill

**Given** the file `skills/subagent-driven-development/SKILL.md` exists
**When** searching for sub-skill references
**Then** the file MUST contain `superpowers:test-driven-development` reference

---

### YAML Frontmatter Presence

> 所有 SKILL.md 文件必须包含标准的 YAML frontmatter。

#### Scenario: All SKILL.md files have valid YAML frontmatter

**Given** all 14 skill directories exist under `skills/`
**When** checking each `SKILL.md` file
**Then** each file MUST start with `---` delimiter
**And** each file MUST contain `name:` field
**And** each file MUST contain `description:` field
**And** the frontmatter MUST be closed with `---` delimiter

---

### Fusion Extension Appendix

> Fusion 扩展必须作为独立章节追加到原版内容之后。

#### Scenario: Fusion extensions are clearly separated

**Given** a SKILL.md file with Fusion extensions
**When** reading the file structure
**Then** there MUST be a horizontal rule (`---`) before the Fusion section
**And** there MUST be a heading "## Fusion 扩展" or equivalent
**And** the original content MUST NOT be modified

#### Scenario: Risk Tier information is present where applicable

**Given** the file `skills/test-driven-development/SKILL.md` exists
**When** reading the Fusion extension section
**Then** the section MUST contain Risk Tier compliance table
**And** the table MUST define Tiers 0, 1, 2, and 3

---

## ADDED Requirements

### Auxiliary Files Restoration

> 具有辅助文件的 Skills 必须恢复完整的辅助文件集。

#### Scenario: test-driven-development has testing-anti-patterns.md

**Given** the directory `skills/test-driven-development/` exists
**When** listing directory contents
**Then** the file `testing-anti-patterns.md` MUST exist
**And** the content MUST match the original superpowers version

#### Scenario: subagent-driven-development has all prompt templates

**Given** the directory `skills/subagent-driven-development/` exists
**When** listing directory contents
**Then** the file `implementer-prompt.md` MUST exist
**And** the file `spec-reviewer-prompt.md` MUST exist
**And** the file `code-quality-reviewer-prompt.md` MUST exist

#### Scenario: systematic-debugging has all auxiliary files

**Given** the directory `skills/systematic-debugging/` exists
**When** listing directory contents
**Then** the file `condition-based-waiting.md` MUST exist
**And** the file `defense-in-depth.md` MUST exist
**And** the file `root-cause-tracing.md` MUST exist
