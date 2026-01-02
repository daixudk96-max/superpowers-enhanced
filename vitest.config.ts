import FusionVitestReporter from './lib/vitest-reporter.js';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
    reporters: [
      'default',
      new FusionVitestReporter(),
    ],
  },
});
