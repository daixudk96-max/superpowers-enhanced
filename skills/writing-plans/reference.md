# Reference: writing-plans

## Codex Collaboration

本 Skill 与 Codex (via CodexMCP) 协作，分工如下:

- **Claude Code**: 需求分析、架构设计、Risk Tier 分配
- **Codex**: 完善需求细节、识别边界情况、验证技术可行性

### 调用时机

1. 完成初步需求分析后，调用 Codex 完善
2. 生成实现计划后，请 Codex 验证可行性

### 调用方式

```typescript
mcp_codex_codex({
  PROMPT: "请分析以下需求，识别边界情况和潜在风险:\n\n{需求内容}",
  cd: "{项目根目录}",
  sandbox: "read-only",
  SESSION_ID: session.planningSession  // 继续会话时传入
})
```

## Risk Tier Guidelines

### Tier 0 - Always Allowed
- Documentation (.md, .txt)
- Comments only changes
- .gitignore, .editorconfig
- README updates

### Tier 1 - Allowed with Logging
- CSS/styling changes
- File/variable renames
- Configuration tweaks
- Import reordering

### Tier 2 - Test or Exemption Required
- Utility functions
- Helper methods
- Non-critical bug fixes
- Minor refactors

### Tier 3 - Strict TDD
- Core business logic
- API endpoints
- Database operations
- Security-related code
- New features

## Phase Planning Tips

- Each phase should be independently deployable if possible
- Keep phases to 3-7 tasks for manageability
- Front-load risky items for early validation
- Mark dependencies explicitly: `<!-- depends: 1.2, 2.1 -->`
