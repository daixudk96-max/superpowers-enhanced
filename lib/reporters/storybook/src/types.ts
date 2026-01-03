/**
 * Storybook Reporter Types for Superpowers-Fusion
 * Self-contained types without external dependencies
 */

export interface StoryError {
  message: string;
  stack?: string;
  expected?: unknown;
  actual?: unknown;
}

export interface StoryTest {
  name: string;
  fullName: string;
  state: 'passed' | 'failed' | 'skipped';
  errors?: StoryError[];
}

export interface StoryModule {
  moduleId: string;
  tests: StoryTest[];
}

export interface TestRunOutput {
  testModules: StoryModule[];
  unhandledErrors: unknown[];
  reason?: 'passed' | 'failed' | 'interrupted';
}

export interface TestContext {
  id: string;
  title: string;
  name: string;
}

export interface StorybookReporterOptions {
  projectRoot?: string;
}
