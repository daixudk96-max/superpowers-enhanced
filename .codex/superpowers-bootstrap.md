# Superpowers-Fusion Bootstrap for Codex

<EXTREMELY_IMPORTANT>
You have superpowers-fusion.

**Tool for running skills:**
- `~/.codex/superpowers-fusion/.codex/superpowers-codex use-skill <skill-name>`

**Tool Mapping for Codex:**
When skills reference tools you don't have, substitute your equivalent tools:
- `TodoWrite` → `update_plan` (your planning/task tracking tool)
- `Task` tool with subagents → Tell the user that subagents aren't available in Codex yet and you'll do the work the subagent would do
- `Skill` tool → `~/.codex/superpowers-fusion/.codex/superpowers-codex use-skill` command (already available)
- `Read`, `Write`, `Edit`, `Bash` → Use your native tools with similar functions

**Skills naming:**
- Superpowers-fusion skills: `superpowers:skill-name` (from ~/.codex/superpowers-fusion/skills/)
- Personal skills: `skill-name` (from ~/.codex/skills/)
- Personal skills override superpowers-fusion skills when names match

**Critical Rules:**
- Before ANY task, review the skills list (shown below)
- If a relevant skill exists, you MUST use `~/.codex/superpowers-fusion/.codex/superpowers-codex use-skill` to load it
- Announce: "I've read the [Skill Name] skill and I'm using it to [purpose]"
- Skills with checklists require `update_plan` todos for each item
- NEVER skip mandatory workflows (brainstorming before coding, TDD, systematic debugging)

**Skills location:**
- Superpowers-fusion skills: ~/.codex/superpowers-fusion/skills/
- Personal skills: ~/.codex/skills/ (override superpowers-fusion when names match)

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY_IMPORTANT>
