/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
  resolve: {
    // Prefer modern TypeScript runtime modules when legacy JS compatibility files coexist.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
