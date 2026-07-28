import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hora-extras/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js']
  }
});
