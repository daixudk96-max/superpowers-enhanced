# /setup - 项目初始化与上下文配置

初始化项目的 Conductor 环境，创建上下文目录结构，并进行交互式配置。

## 用法

```bash
# 交互式设置（默认）
npx tsx commands/setup.ts

# 非交互式（仅创建模板）
npx tsx commands/setup.ts --no-interactive
```

## 执行流程

你必须按照以下步骤顺序执行：

### 1. 环境检查与恢复

1. **检查状态文件**: 读取 `.fusion/setup_state.json`
   - 如果存在，根据 `last_successful_step` 恢复到上次中断的位置
   - 如果不存在，这是全新设置

### 2. 项目类型检测

1. **检测 Brownfield（已有项目）指标**:
   - `.git` 目录存在
   - `package.json`, `pom.xml`, `requirements.txt`, `go.mod` 存在
   - `src/`, `app/`, `lib/` 包含代码文件

2. **分类项目**:
   - **Brownfield**: 满足任一上述条件
   - **Greenfield**: 目录为空或仅有 README.md

3. **Brownfield 处理**:
   - 宣布检测到已有项目
   - 请求许可进行只读分析
   - 分析 README.md 和配置文件推断技术栈

### 3. 交互式配置

#### 3.1 产品指南 (Product Guide)

询问用户：
1. 产品名称是什么？
2. 请用一段话描述产品的核心价值
3. 目标用户是谁？
4. 核心功能有哪些？

输出: `context/product.md`

#### 3.2 技术栈 (Tech Stack)

1. **自动检测**: 从 `package.json`, `tsconfig.json` 等推断
2. **用户确认**: 显示检测结果，让用户确认或修改
3. 询问：
   - 主要编程语言？
   - 使用的框架？
   - 测试框架？
   - 构建工具？

输出: `context/tech-stack.md`

#### 3.3 工作流 (Workflow)

询问用户：
1. 分支策略（Git Flow / GitHub Flow / Trunk-based）？
2. 代码审查需要几人批准？
3. CI/CD 工具是什么？

输出: `context/workflow.md`

### 4. 创建目录结构

```
项目根目录/
├── context/
│   ├── product.md
│   ├── tech-stack.md
│   └── workflow.md
├── changes/
│   └── (变更目录)
└── .fusion/
    ├── status.json
    └── setup_state.json
```

### 5. 保存状态

每完成一步，更新 `.fusion/setup_state.json`:

```json
{
  "last_successful_step": "3.2_tech_stack",
  "product_name": "...",
  "detected_tech": {...}
}
```

## 完成条件

确认以下内容：
- [ ] `context/` 目录存在，包含 3 个配置文件
- [ ] `changes/` 目录存在
- [ ] `.fusion/` 目录存在
- [ ] 技术栈已正确识别

## 下一步

设置完成后，提示用户：
> "项目初始化完成！使用 `/brainstorm` 开始规划功能，或使用 `/new-change <name>` 直接创建变更。"
