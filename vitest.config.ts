import FusionVitestReporter from 'superpowers-fusion/lib/vitest-reporter';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  reporters: [
    'default',
    new FusionVitestReporter(),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
});
