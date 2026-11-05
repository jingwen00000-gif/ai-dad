import { defineConfig } from 'vitest/config';

// e2e 需要本地 Postgres + Redis：先在仓库根目录执行 pnpm db:up && pnpm db:migrate
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
  },
});
