import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true
    },
    test: {
        environment: 'jsdom',
        globals: false,
        setupFiles: ['./test/vitest/setup.ts'],
        include: ['src/**/test.unit.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                '**/*.d.ts',
                '**/test.unit.{ts,tsx}',
                '**/*.mock.{ts,tsx}',
                'test/**',
                'src/app/**',
                'src/proxy.ts',
                'src/lib/db/auth-schema.ts'
            ],
            thresholds: {
                statements: 11,
                branches: 16,
                functions: 10,
                lines: 11
            }
        }
    }
});
