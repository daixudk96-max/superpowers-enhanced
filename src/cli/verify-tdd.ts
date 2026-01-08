import { verifyTdd } from '../adapters/tdd-guard-adapter.js'

export function verifyTddCommand(args: string[]): void {
  verifyTdd(process.cwd(), args)
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error(`TDD verify failed: ${error}`)
      process.exit(0)
    })
}
