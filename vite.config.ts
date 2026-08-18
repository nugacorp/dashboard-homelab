import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

// The web app is same-origin with the API in production: the Express server
// serves dist/web and mounts the API under /api. In development we keep the
// same contract by proxying /api to the local backend, so the frontend never
// needs to know a LAN address.
const API_TARGET = process.env.DEV_API_TARGET ?? 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: false,
      },
    },
  },
});
