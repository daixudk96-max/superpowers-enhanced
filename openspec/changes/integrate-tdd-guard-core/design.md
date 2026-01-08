# 设计文档：Tier 功能迁移

## 背景

`superpowers-fusion` 原先实现了 **Tier**（验证严格程度）功能。原版 `tdd-guard` 没有 Tier 概念，但提供了更灵活的替代方案。

## Tier 功能本质

Tier 1/2/3 本质上是控制 TDD 验证的**严格程度**：

- **Tier 1（宽松）**：允许部分跳过测试优先
- **Tier 2（标准）**：标准 TDD 流程
- **Tier 3（严格）**：拒绝任何没有测试的实现

## 原版 tdd-guard 替代方案

### 1. 自定义指令 (`instructions.md`)

**位置**：`.claude/tdd-guard/data/instructions.md`

**功能**：完全自定义验证规则。可以编写不同严格程度的规则集。

**Tier 映射示例**：

```markdown
# Tier 3（严格模式）
- 任何实现代码必须首先有对应的失败测试
- 零容忍未测试的函数
- 仅在测试 100% 通过时才允许重构
```

```markdown
# Tier 1（宽松模式）
- 允许没有测试的简单 stub 实现
- 只关注主要逻辑，忽略工具函数
- 原型代码可以暂时跳过 TDD
```

### 2. 忽略模式 (`config.json`)

**位置**：`.claude/tdd-guard/data/config.json`

**功能**：指定哪些文件/目录跳过 TDD 验证。对于 Tier 1 的"快速原型"场景非常有用。

```json
{
  "guardEnabled": true,
  "ignorePatterns": [
    "*.md",
    "*.json",
    "**/prototypes/**",
    "**/scripts/**"
  ]
}
```

### 3. guardEnabled 开关

**位置**：`.claude/tdd-guard/data/config.json`

**功能**：全局开关。相当于 Tier 0（完全禁用）。

```json
{
  "guardEnabled": false
}
```

## 推荐迁移策略

| 原 Tier | 迁移到 |
|---------|--------|
| Tier 0（禁用） | `guardEnabled: false` |
| Tier 1（宽松） | 自定义 `instructions.md` + 宽松 `ignorePatterns` |
| Tier 2（标准） | 使用默认规则（无需修改） |
| Tier 3（严格） | 自定义 `instructions.md` 增强规则 |

## 实现建议

1. **保留 Tier 作为 CLI 参数**（可选）：
   创建一个 `fusion tier set <1|2|3>` 命令，自动生成对应的 `instructions.md` 和 `config.json`。

2. **文档化映射**：
   在 README 中说明如何通过原版功能达到相同效果。

3. **默认 Tier 2**：
   不做任何修改时，使用原版默认规则即为 Tier 2。
