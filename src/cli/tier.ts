import fs from 'node:fs'
import path from 'node:path'

type TierLevel = 1 | 2 | 3

interface TierPreset {
  config: object | null
  instructions: string | null
}

function dataDir(cwd: string): string {
  return path.join(cwd, '.claude', 'tdd-guard', 'data')
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function presetForTier(tier: TierLevel): TierPreset {
  if (tier === 1) {
    return {
      config: {
        guardEnabled: true,
        ignorePatterns: [
          '*.md',
          '*.json',
          '*.yml',
          '*.yaml',
          '*.css',
          '*.scss',
          '**/prototypes/**',
          '**/scripts/**',
        ],
      },
      instructions: `# Tier 1（宽松模式）
- 允许原型/脚手架代码暂时跳过测试
- 文档、配置和样式文件直接放行
- 主要业务逻辑仍建议先写测试，再实现
`,
    }
  }

  if (tier === 3) {
    return {
      config: {
        guardEnabled: true,
        ignorePatterns: [],
      },
      instructions: `# Tier 3（严格模式）
- 任何实现前必须先写失败测试（红灯）
- 没有测试的实现一律阻断
- 重构只在所有测试通过时进行
- 遇到阻断时先补充测试，再继续编码
`,
    }
  }

  // Tier 2：使用默认规则，删除自定义配置/指令以回到内置行为
  return {
    config: null,
    instructions: null,
  }
}

function writeFileIfContent(filePath: string, content: string | null): void {
  if (content === null) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath)
    }
    return
  }
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
}

export function setTierPreset(cwd: string, tier: TierLevel): { configPath: string; instructionsPath: string } {
  const dir = dataDir(cwd)
  const { config, instructions } = presetForTier(tier)

  const configPath = path.join(dir, 'config.json')
  const instructionsPath = path.join(dir, 'instructions.md')

  writeFileIfContent(configPath, config ? JSON.stringify(config, null, 2) : null)
  writeFileIfContent(instructionsPath, instructions)

  return { configPath, instructionsPath }
}

function parseTierArg(value: string | undefined): TierLevel | null {
  const num = Number(value)
  if (num === 1 || num === 2 || num === 3) {
    return num
  }
  return null
}

export async function tierCommand(args: string[]): Promise<void> {
  const [sub, maybeTier] = args
  if (sub !== 'set') {
    console.log('用法: superpowers-fusion tier set <1|2|3>')
    process.exit(1)
  }

  const tier = parseTierArg(maybeTier)
  if (!tier) {
    console.error('Tier 只能是 1、2 或 3')
    process.exit(1)
  }

  const cwd = process.cwd()
  const { configPath, instructionsPath } = setTierPreset(cwd, tier)

  console.log(`已应用 Tier ${tier} 预设`)
  if (tier === 2) {
    console.log(`已移除自定义配置，使用默认规则`)
  } else {
    console.log(`配置: ${configPath}`)
    console.log(`指令: ${instructionsPath}`)
  }
}
