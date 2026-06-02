import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    envFile: '.env.test',
    setupFiles: ['./tests/setup/db.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/service/summery.LLM.service.ts',
        'src/service/ydl.service.ts',
      ],
    },
  },
})
