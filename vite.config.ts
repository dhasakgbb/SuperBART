import { defineConfig } from 'vite';

export default defineConfig({
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
