import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from '../../lib/config-loader.js'
import { determineRiskTier } from '../../lib/risk-validator.js'
import { isTestFile } from '../../lib/language-adapter.js'
import { hasExemptionComment } from '../hooks/preToolEdit.js'
import { createRequire } from 'node:module'
import type { ValidationResult } from '../../tdd-guard/src/contracts/types/ValidationResult.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const tddGuardDist = path.join(repoRoot, 'tdd-guard', 'dist')
// tdd-guard is compiled as CJS; use require to import
const { Config } = require(path.join(tddGuardDist, 'index.js')) as {
  Config: new (...args: unknown[]) => unknown
}
const { run: runTddGuard } = require(path.join(tddGuardDist, 'cli/tdd-guard.js')) as {
  run: (input: string, config?: unknown) => Promise<ValidationResult>
}

type HookInputCandidate = Record<string, unknown>

function extractFilePath(parsedData: HookInputCandidate): string | null {
  if (parsedData.input && typeof parsedData.input === 'object') {
    const input = parsedData.input as Record<string, unknown>
    if (typeof input.file_path === 'string') {
      return input.file_path
    }
  }

  if (parsedData.toolInput && typeof parsedData.toolInput === 'object') {
    const input = parsedData.toolInput as Record<string, unknown>
    if (typeof input.file_path === 'string') {
      return input.file_path
    }
  }

  if (parsedData.tool_input && typeof parsedData.tool_input === 'object') {
    const input = parsedData.tool_input as Record<string, unknown>
    if (typeof input.file_path === 'string') {
      return input.file_path
    }
  }

  if (typeof parsedData.file_path === 'string') {
    return parsedData.file_path
  }

  return null
}

function extractContent(parsedData: HookInputCandidate): string | undefined {
  if (parsedData.input && typeof parsedData.input === 'object') {
    const input = parsedData.input as Record<string, unknown>
    if (typeof input.content === 'string') {
      return input.content
    }
    if (typeof input.new_string === 'string') {
      return input.new_string
    }
  }

  if (parsedData.toolInput && typeof parsedData.toolInput === 'object') {
    const input = parsedData.toolInput as Record<string, unknown>
    if (typeof input.content === 'string') {
      return input.content
    }
  }

  if (parsedData.tool_input && typeof parsedData.tool_input === 'object') {
    const input = parsedData.tool_input as Record<string, unknown>
    if (typeof input.content === 'string') {
      return input.content
    }
  }

  return undefined
}

function getToolInput(parsedData: HookInputCandidate): Record<string, unknown> {
  const candidates = [parsedData.tool_input, parsedData.toolInput, parsedData.input]
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return { ...(candidate as Record<string, unknown>) }
    }
  }
  return {}
}

function normalizeHookData(
  parsedData: HookInputCandidate,
  filePath: string,
  config: any,
  cwd: string
): HookInputCandidate {
  const toolInput = getToolInput(parsedData)
  if (!toolInput.file_path) {
    toolInput.file_path = filePath
  }

  const transcriptPath =
    typeof parsedData.transcript_path === 'string' && parsedData.transcript_path.length > 0
      ? parsedData.transcript_path
      : typeof parsedData.transcriptPath === 'string' && parsedData.transcriptPath.length > 0
        ? parsedData.transcriptPath
        : path.join(config.dataDir ?? path.join(cwd, '.claude', 'tdd-guard', 'data'), 'transcript.jsonl')

  return {
    session_id:
      (typeof parsedData.session_id === 'string' && parsedData.session_id) ||
      (typeof parsedData.sessionId === 'string' && parsedData.sessionId) ||
      'fusion-session',
    transcript_path: transcriptPath,
    hook_event_name:
      (typeof parsedData.hook_event_name === 'string' && parsedData.hook_event_name) || 'PreToolUse',
    tool_name:
      (typeof parsedData.tool_name === 'string' && parsedData.tool_name) ||
      (typeof parsedData.tool === 'string' && parsedData.tool) ||
      (typeof parsedData.toolName === 'string' && parsedData.toolName) ||
      'Edit',
    tool_input: toolInput,
  }
}

async function readStdin(): Promise<string> {
  return await new Promise((resolve) => {
    let inputData = ''
    const timer = setTimeout(() => resolve(inputData), 2000)

    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      inputData += chunk
    })

    process.stdin.on('end', () => {
      clearTimeout(timer)
      resolve(inputData)
    })
  })
}

async function resolveInput(args: string[]): Promise<HookInputCandidate | null> {
  if (args.length > 0) {
    const filePath = args[0]
    return {
      hook_event_name: 'PreToolUse',
      tool_name: 'Edit',
      tool_input: {
        file_path: filePath,
      },
    }
  }

  const stdinData = await readStdin()
  if (!stdinData.trim()) {
    return null
  }

  try {
    return JSON.parse(stdinData) as HookInputCandidate
  } catch {
    return null
  }
}

function toExitCode(result: ValidationResult | undefined): number {
  if (result?.decision === 'block') {
    const reason = result.reason ?? 'TDD violation'
    console.error(`\n🛑 TDD Guard blocked this edit: ${reason}\n`)
    return 1
  }
  return 0
}

export async function verifyTdd(cwd: string, args: string[]): Promise<number> {
  const runtimeConfig = loadConfig()
  if (!runtimeConfig.tdd.enabled) {
    return 0
  }

  const parsedData = await resolveInput(args)
  if (!parsedData) {
    console.error('TDD Guard: no hook data received')
    return 1
  }

  const filePath = extractFilePath(parsedData)
  if (!filePath) {
    console.error('TDD Guard: missing file_path in hook data')
    return 1
  }

  if (isTestFile(filePath)) {
    return 0
  }

  const riskTier = determineRiskTier(filePath)
  if (riskTier.tier <= 1) {
    return 0
  }

  const content = extractContent(parsedData)
  if (riskTier.tier === 2 && content && hasExemptionComment(content)) {
    return 0
  }

  const config = new Config()
  const normalizedHook = normalizeHookData(parsedData, filePath, config, cwd)

  try {
    const result = await runTddGuard(JSON.stringify(normalizedHook), config)
    return toExitCode(result)
  } catch (error) {
    console.error(`TDD Guard adapter error: ${error}`)
    return 0
  }
}
