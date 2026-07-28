import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // GitHub Pages is served below the repository name; Firebase Hosting is not.
  base: mode === 'github' ? '/hora-extras/' : '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
}));
