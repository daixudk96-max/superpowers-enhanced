# Installing Superpowers-Fusion for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Node.js installed
- Git installed

## Installation Steps

### 1. Install Superpowers-Fusion

```bash
# Option 1: NPM install
npm install -g superpowers-fusion
superpowers-fusion init

# Option 2: Manual clone
mkdir -p ~/.config/opencode/superpowers-fusion
git clone https://github.com/YOUR_USER/superpowers-fusion.git ~/.config/opencode/superpowers-fusion
```

### 2. Register the Plugin

Create a symlink so OpenCode discovers the plugin:

```bash
mkdir -p ~/.config/opencode/plugin
ln -sf ~/.config/opencode/superpowers-fusion/.opencode/plugin/superpowers.js ~/.config/opencode/plugin/superpowers.js
```

### 3. Restart OpenCode

Restart OpenCode. The plugin will automatically inject superpowers-fusion context via the chat.message hook.

You should see superpowers-fusion is active when you ask "do you have superpowers?"

## Usage

### Finding Skills

Use the `find_skills` tool to list all available skills:

```
use find_skills tool
```

### Loading a Skill

Use the `use_skill` tool to load a specific skill:

```
use use_skill tool with skill_name: "superpowers:brainstorming"
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers-fusion skills with the same name.

### Project Skills

Create project-specific skills in your OpenCode project:

```bash
# In your OpenCode project
mkdir -p .opencode/skills/my-project-skill
```

**Skill Priority:** Project skills override personal skills, which override superpowers-fusion skills.

## Updating

```bash
cd ~/.config/opencode/superpowers-fusion
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin file exists: `ls ~/.config/opencode/superpowers-fusion/.opencode/plugin/superpowers.js`
2. Check OpenCode logs for errors
3. Verify Node.js is installed: `node --version`

### Skills not found

1. Verify skills directory exists: `ls ~/.config/opencode/superpowers-fusion/skills`
2. Use `find_skills` tool to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

## Getting Help

- Report issues: https://github.com/YOUR_USER/superpowers-fusion/issues
- Documentation: https://github.com/YOUR_USER/superpowers-fusion
