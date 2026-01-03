import * as fs from 'fs';
import * as path from 'path';
import type {
  TestContext,
  TestRunOutput,
  StoryTest,
  StoryModule,
  StoryError,
  StorybookReporterOptions,
} from './types';

/**
 * Storybook Reporter for Superpowers-Fusion
 * Collects Storybook test results and saves to .fusion/test-results.json
 */
export class StorybookReporter {
  private readonly projectRoot: string;
  private readonly collectedTests: Map<string, StoryTest[]> = new Map();

  constructor(options?: StorybookReporterOptions) {
    this.projectRoot = options?.projectRoot || process.cwd();
  }

  async onStoryResult(
    context: TestContext,
    status: 'passed' | 'failed' | 'skipped' = 'passed',
    errors?: unknown[]
  ): Promise<void> {
    const moduleId = context.id;
    const test: StoryTest = {
      name: context.name,
      fullName: `${context.title} > ${context.name}`,
      state: status,
    };

    // Add errors if present
    if (errors && errors.length > 0) {
      test.errors = errors.map((err: unknown): StoryError => {
        const errorObj = err as Record<string, unknown>;
        const message = errorObj.message;
        return {
          message: typeof message === 'string' ? message : String(err),
          stack: errorObj.stack as string | undefined,
        };
      });
    }

    if (!this.collectedTests.has(moduleId)) {
      this.collectedTests.set(moduleId, []);
    }
    this.collectedTests.get(moduleId)!.push(test);
  }

  async onComplete(): Promise<void> {
    const testModules: StoryModule[] = Array.from(
      this.collectedTests.entries()
    ).map(([moduleId, tests]) => ({
      moduleId,
      tests,
    }));

    const output: TestRunOutput = {
      testModules,
      unhandledErrors: [],
      reason: this.determineReason(testModules),
    };

    await this.saveResults(output);
  }

  private async saveResults(output: TestRunOutput): Promise<void> {
    const fusionDir = path.join(this.projectRoot, '.fusion');

    if (!fs.existsSync(fusionDir)) {
      fs.mkdirSync(fusionDir, { recursive: true });
    }

    const outputPath = path.join(fusionDir, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  }

  private determineReason(
    testModules: StoryModule[]
  ): 'passed' | 'failed' | undefined {
    const allTests = testModules.flatMap((m) => m.tests);
    if (allTests.length === 0) {
      return undefined;
    }
    const hasFailures = allTests.some((t) => t.state === 'failed');
    return hasFailures ? 'failed' : 'passed';
  }
}

export default StorybookReporter;
