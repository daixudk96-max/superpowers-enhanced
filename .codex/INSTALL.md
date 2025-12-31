# Installing Superpowers-Fusion for Codex

Quick setup to enable superpowers-fusion skills in Codex.

## Installation

1. **Install superpowers-fusion**:
   ```bash
   npm install -g superpowers-fusion
   superpowers-fusion init
   ```

2. **Or clone and setup manually**:
   ```bash
   mkdir -p ~/.codex/superpowers-fusion
   cd ~/.codex/superpowers-fusion
   git clone https://github.com/YOUR_USER/superpowers-fusion.git .
   ```

3. **Create personal skills directory**:
   ```bash
   mkdir -p ~/.codex/skills
   ```

4. **Update ~/.codex/AGENTS.md** to include this superpowers-fusion section:
   ```markdown
   ## Superpowers-Fusion System

   <EXTREMELY_IMPORTANT>
   You have superpowers-fusion. Superpowers-fusion teaches you new skills and capabilities. RIGHT NOW run: `~/.codex/superpowers-fusion/.codex/superpowers-codex bootstrap` and follow the instructions it returns.
   </EXTREMELY_IMPORTANT>
   ```

## Verification

Test the installation:
```bash
~/.codex/superpowers-fusion/.codex/superpowers-codex bootstrap
```

You should see skill listings and bootstrap instructions. The system is now ready for use.
