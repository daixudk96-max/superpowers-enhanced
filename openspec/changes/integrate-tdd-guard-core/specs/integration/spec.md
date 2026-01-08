# 规格说明：TDD Guard 核心整合

## 上下文

整合原版 `tdd-guard` 代码以替换自定义实现。本规格说明详述了整合的配置和行为需求。

## 修改的需求

### 配置

#### 场景：旧版 "Tier" 设置

假设用户询问 "tier" 配置
那么系统必须说明 "tier" 已废弃
并且系统必须改用 `VALIDATION_CLIENT`（默认值：'sdk'）

#### 场景：环境变量

假设是全新安装
当检查 `.env` 时
那么它必须包含 `VALIDATION_CLIENT`、`TDD_GUARD_MODEL_VERSION`
并且它不得包含旧版 `TDD_DEFAULT_TIER`

### 适配器行为

#### 场景：执行验证 TDD

假设调用了 `verify-tdd` 命令
当适配器接收控制时
那么它必须使用 process.env 初始化 `tdd-guard` Config
并且它必须使用当前上下文调用 `tdd-guard` Validator
并且它必须返回 Validator 的确切退出码

### 依赖完整性

#### 场景：模块解析

假设项目已构建
当从 `@tdd-guard/*` 导入时
那么编译器必须正确解析到 `tdd-guard/src/*`
