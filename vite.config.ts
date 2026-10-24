/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 3000,
    host: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
} as any);