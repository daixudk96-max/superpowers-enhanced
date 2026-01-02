# Project Context

## Purpose
整合多个 AI 编码扩展项目的优势，创建一个统一的 Claude Code 插件 `superpowers-fusion`，融合:
- obra/superpowers 的技能驱动工作流
- nizos/tdd-guard 的程序化 TDD 强制
- Fission-AI/OpenSpec 的规格驱动开发和归档机制
- gemini-cli-extensions/conductor 的上下文管理和可追溯回退

## Tech Stack
- TypeScript (主要实现语言)
- Node.js (运行时)
- Claude Code Hooks API
- @babel/parser & @babel/traverse (AST 分析)
- minimatch (文件模式匹配)

## Project Conventions

### Code Style
- 使用 TypeScript strict mode
- ESLint + Prettier 格式化
- 函数优先于类（除非需要状态管理）

### Architecture Patterns
- 插件化架构：Skills, Hooks, Commands 分离
- 事件驱动：PreToolUse / PostToolUse Hooks
- 状态持久化：JSON 文件存储

### Testing Strategy
- TDD 强制：必须先写失败测试
- 单元测试覆盖核心逻辑
- 集成测试验证 Hooks 行为

### Git Workflow
- Conventional Commits
- 功能分支开发
- OpenSpec 归档追踪变更历史

## Domain Context
- Claude Code 是 Anthropic 的 AI 编码助手
- Hooks 是 Claude Code 的扩展机制，可在工具执行前后拦截
- Skills 是 Superpowers 的核心概念，通过 SKILL.md 文件教育 AI 行为
- OpenSpec 的 changes/ 目录结构支持变更归档和回溯

## Important Constraints
- 仅支持 Claude Code 平台
- Hooks 必须是同步执行（不能使用 async/await）
- 状态文件不能过大（影响启动速度）

## External Dependencies
- Claude Code API (Hooks, Tools)
- 文件系统 API
- 可选: Python 用于 pytest AST 分析
